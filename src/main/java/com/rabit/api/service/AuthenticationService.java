package com.rabit.api.service;

import com.rabit.api.dto.request.LoginRequest;
import com.rabit.api.dto.request.RegisterRequest;
import com.rabit.api.dto.request.VerifyEmailRequest;
import com.rabit.api.dto.response.LoginResponse;
import com.rabit.api.dto.response.RegisterResponse;
import com.rabit.api.dto.response.UserMeResponse;
import com.rabit.api.dto.response.VerifyEmailResponse;
import com.rabit.api.exception.EmailNotVerifiedException;
import com.rabit.api.exception.InvalidTokenException;
import com.rabit.api.exception.ResourceNotFoundException;
import com.rabit.api.exception.UserAlreadyExistsException;
import com.rabit.api.model.entities.Company;
import com.rabit.api.model.entities.User;
import com.rabit.api.model.entities.VerificationToken;
import com.rabit.api.model.enums.UserStatus;
import com.rabit.api.repository.CompanyRepository;
import com.rabit.api.repository.CompanyUserRepository;
import com.rabit.api.repository.UserRepository;
import com.rabit.api.repository.VerificationTokenRepository;
import com.rabit.api.util.EmailService;
import com.rabit.api.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthenticationService {
    
    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final CompanyRepository companyRepository;
    private final CompanyUserRepository companyUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    
    @Value("${app.jwt.verification-expiration:3600000}")
    private long verificationExpiration;
    
    @Value("${app.jwt.expiration:86400000}")
    private long jwtExpiration;
    
    private static final String TOKEN_TYPE_EMAIL_VERIFICATION = "EMAIL_VERIFICATION";
    private static final String TOKEN_STATUS_ACTIVE = "ACTIVE";
    private static final String TOKEN_STATUS_USED = "USED";
    
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.countByEmail(request.getUser().getEmail()) > 0) {
            throw new UserAlreadyExistsException("Email already exists: " + request.getUser().getEmail());
        }
        
        if (userRepository.countByUsername(request.getUser().getUsername()) > 0) {
            throw new UserAlreadyExistsException("Username already exists: " + request.getUser().getUsername());
        }
        
        User user = User.builder()
                .username(request.getUser().getUsername())
                .email(request.getUser().getEmail())
                .passwordHash(passwordEncoder.encode(request.getUser().getPassword()))
                .firstName(request.getUser().getFirstName())
                .lastName(request.getUser().getLastName())
                .addressLine1(request.getUser().getAddressLine1())
                .addressLine2(request.getUser().getAddressLine2())
                .city(request.getUser().getCity())
                .state(request.getUser().getState())
                .pinCode(request.getUser().getPinCode())
                .country(request.getUser().getCountry())
                .status(UserStatus.INACTIVE)
                .emailVerified(false)
                .build();
        
        user = userRepository.save(user);
        log.info("User created during registration: {}", user.getEmail());
        
        String verificationTokenString = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
                .user(user)
                .token(verificationTokenString)
                .tokenType(TOKEN_TYPE_EMAIL_VERIFICATION)
                .status(TOKEN_STATUS_ACTIVE)
                .expiryAt(Instant.now().plusSeconds(verificationExpiration / 1000))
                .build();
        
        verificationTokenRepository.save(verificationToken);
        log.info("Verification token created for user: {}", user.getEmail());
        
        emailService.sendVerificationEmail(user.getEmail(), verificationTokenString);
        
        log.info("Registration completed for user: {}", user.getEmail());
        
        return RegisterResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .status(user.getStatus())
                .message("Verification email sent. Please verify your email.")
                .build();
    }
    
    public VerifyEmailResponse verifyEmail(VerifyEmailRequest request) {
        VerificationToken token = verificationTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired token"));
        
        if (token.getExpiryAt().isBefore(Instant.now())) {
            throw new InvalidTokenException("Token has expired");
        }
        
        if (!TOKEN_STATUS_ACTIVE.equals(token.getStatus())) {
            throw new InvalidTokenException("Token has already been used");
        }
        
        User user = token.getUser();
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(true);
        userRepository.save(user);
        
        token.setStatus(TOKEN_STATUS_USED);
        verificationTokenRepository.save(token);
        
        log.info("Email verified successfully: {}", user.getEmail());
        
        return VerifyEmailResponse.builder()
                .status("VERIFIED")
                .message("Email verified successfully")
                .build();
    }
    
    public LoginResponse login(LoginRequest request) {
        String loginIdentifier = request.getIdentifier();
        String genericError = "Log in failed, please provide correct username or password";
        
        var userOptional = userRepository.findByEmail(loginIdentifier);
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByUsername(loginIdentifier);
        }
        
        if (userOptional.isEmpty()) {
            log.warn("Login attempt with non-existent identifier: {}", loginIdentifier);
            throw new IllegalArgumentException(genericError);
        }
        
        User user = userOptional.get();
        
        if (!user.isEmailVerified()) {
            log.warn("Login attempt for unverified email: {}", loginIdentifier);
            throw new EmailNotVerifiedException("Email verification pending. Please verify your email first.");
        }
        
        if (user.getStatus() == UserStatus.LOCKED || user.getStatus() == UserStatus.DISABLED) {
            log.warn("Login attempt for {} account: {}", user.getStatus().name(), loginIdentifier);
            throw new IllegalArgumentException("User account is " + user.getStatus().name().toLowerCase() + ". Please contact support.");
        }
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login attempt with wrong password for existing user: {}", loginIdentifier);
            throw new IllegalArgumentException(genericError);
        }
        
        String token = jwtTokenProvider.generateToken(user.getUserId(), user.getEmail());
        
        log.info("User logged in successfully: {}", user.getEmail());
        
        return LoginResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .token(token)
                .expiresIn(jwtExpiration)
                .build();
    }
    
    @Transactional(readOnly = true)
    public UserMeResponse getMe(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        List<UserMeResponse.CompanyInfo> companies = companyUserRepository.findByUserUserId(userId)
                .stream()
                .map(cu -> {
                    Company company = cu.getCompany();
                    return UserMeResponse.CompanyInfo.builder()
                            .companyId(company.getCompanyId())
                            .name(company.getName())
                            .role(cu.getRole())
                            .build();
                })
                .collect(Collectors.toList());
        
        return UserMeResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .city(user.getCity())
                .state(user.getState())
                .country(user.getCountry())
                .status(user.getStatus())
                .companies(companies)
                .build();
    }

    @Transactional
    public void forceVerifyEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        verificationTokenRepository.deleteByUserUserId(user.getUserId());
    }
}
