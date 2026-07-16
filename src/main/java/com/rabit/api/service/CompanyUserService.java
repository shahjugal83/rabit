package com.rabit.api.service;

import com.rabit.api.dto.request.AddUserToCompanyRequest;
import com.rabit.api.dto.response.CompanyUserResponse;
import com.rabit.api.exception.ResourceNotFoundException;
import com.rabit.api.exception.UserAlreadyExistsException;
import com.rabit.api.model.entities.CompanyUser;
import com.rabit.api.model.entities.User;
import com.rabit.api.model.entities.VerificationToken;
import com.rabit.api.model.enums.CompanyRole;
import com.rabit.api.model.enums.UserStatus;
import com.rabit.api.repository.CompanyRepository;
import com.rabit.api.repository.CompanyUserRepository;
import com.rabit.api.repository.UserRepository;
import com.rabit.api.repository.VerificationTokenRepository;
import com.rabit.api.util.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CompanyUserService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CompanyUserRepository companyUserRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.jwt.verification-expiration:3600000}")
    private long verificationExpiration;

    public CompanyUserResponse addUserToCompany(UUID companyId, AddUserToCompanyRequest request, UUID superAdminUserId) {
        companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        CompanyUser superAdminMembership = companyUserRepository
                .findByUserUserIdAndCompanyCompanyId(superAdminUserId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("You are not a member of this company"));

        if (superAdminMembership.getRole() != CompanyRole.SUPER_ADMIN) {
            throw new IllegalArgumentException("Only SUPER_ADMIN can add users to the company");
        }

        boolean alreadyMember = companyUserRepository
                .countByUserUserIdAndCompanyCompanyId(findOrCreateUser(request).getUserId(), companyId) > 0;
        if (alreadyMember) {
            throw new UserAlreadyExistsException("User is already a member of this company");
        }

        User user = findOrCreateUser(request);
        boolean isNewUser = user.getCreatedAt() == null || user.getStatus() == UserStatus.INACTIVE;

        CompanyUser companyUser = CompanyUser.builder()
                .user(user)
                .company(companyRepository.findById(companyId).get())
                .role(request.getRole())
                .active(true)
                .build();

        companyUserRepository.save(companyUser);

        String message;
        if (isNewUser) {
            message = "New user created and added to company. Verification email sent.";
        } else {
            message = "User added to company";
        }

        log.info("User {} added to company {} with role {}", user.getEmail(), companyId, request.getRole());

        return CompanyUserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(request.getRole())
                .active(true)
                .createdAt(companyUser.getCreatedAt())
                .message(message)
                .build();
    }

    private User findOrCreateUser(AddUserToCompanyRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .orElseGet(() -> createNewUser(request));
    }

    private User createNewUser(AddUserToCompanyRequest request) {
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            throw new IllegalArgumentException("Username is required for new users");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required for new users");
        }

        if (userRepository.countByEmail(request.getEmail()) > 0) {
            throw new UserAlreadyExistsException("Email already exists: " + request.getEmail());
        }
        if (userRepository.countByUsername(request.getUsername()) > 0) {
            throw new UserAlreadyExistsException("Username already exists: " + request.getUsername());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .status(UserStatus.INACTIVE)
                .emailVerified(false)
                .build();

        user = userRepository.save(user);
        log.info("New user created via company invite: {}", user.getEmail());

        String verificationTokenString = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
                .user(user)
                .token(verificationTokenString)
                .tokenType("EMAIL_VERIFICATION")
                .status("ACTIVE")
                .expiryAt(Instant.now().plusSeconds(verificationExpiration / 1000))
                .build();

        verificationTokenRepository.save(verificationToken);
        emailService.sendVerificationEmail(user.getEmail(), verificationTokenString);

        return user;
    }
}
