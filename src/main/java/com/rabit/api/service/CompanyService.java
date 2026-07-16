package com.rabit.api.service;

import com.rabit.api.dto.request.CreateCompanyRequest;
import com.rabit.api.dto.request.UpdateCompanyRequest;
import com.rabit.api.dto.response.CompanyResponse;
import com.rabit.api.exception.ResourceNotFoundException;
import com.rabit.api.exception.UserAlreadyExistsException;
import com.rabit.api.model.entities.Company;
import com.rabit.api.model.entities.CompanyUser;
import com.rabit.api.model.entities.User;
import com.rabit.api.model.enums.CompanyRole;
import com.rabit.api.repository.CompanyRepository;
import com.rabit.api.repository.CompanyUserRepository;
import com.rabit.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CompanyService {
    
    private static final long MAX_FILE_SIZE = 50 * 1024; // 50KB
    
    private final CompanyRepository companyRepository;
    private final CompanyUserRepository companyUserRepository;
    private final UserRepository userRepository;
    
    public CompanyResponse createCompany(CreateCompanyRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (companyRepository.countByName(request.getName()) > 0) {
            throw new UserAlreadyExistsException("Company name already exists: " + request.getName());
        }
        
        String urlSlug = generateUrlSlug(request.getName());
        
        Company company = Company.builder()
                .name(request.getName())
                .urlSlug(urlSlug)
                .description(request.getAboutCompany())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .pinCode(request.getPinCode())
                .contactNumber(request.getContactNumber())
                .createdBy(userId)
                .active(true)
                .build();
        
        if (request.getLogo() != null && !request.getLogo().isEmpty()) {
            if (request.getLogo().getSize() > MAX_FILE_SIZE) {
                throw new IllegalArgumentException("Logo size must not exceed 50KB");
            }
            try {
                company.setLogo(request.getLogo().getBytes());
            } catch (Exception e) {
                log.warn("Failed to upload logo", e);
            }
        }
        
        company = companyRepository.save(company);
        
        CompanyUser companyUser = CompanyUser.builder()
                .user(user)
                .company(company)
                .role(CompanyRole.SUPER_ADMIN)
                .active(true)
                .build();
        
        companyUserRepository.save(companyUser);
        
        log.info("Company created successfully: {} by user: {} with SUPER_ADMIN role", company.getName(), user.getEmail());
        
        return buildCompanyResponse(company, CompanyRole.SUPER_ADMIN);
    }
    
    public void validateSuperAdminExistsForCompany(UUID companyId) {
        long superAdminCount = companyUserRepository.countActiveSuperAdminsByCompanyId(companyId);
        if (superAdminCount == 0) {
            throw new IllegalArgumentException("Company must have at least one SUPER_ADMIN");
        }
    }
    
    public void removeSuperAdminGuard(UUID companyId, UUID userId) {
        long superAdminCount = companyUserRepository.countActiveSuperAdminsByCompanyId(companyId);
        if (superAdminCount <= 1) {
            throw new IllegalArgumentException("Cannot remove the last SUPER_ADMIN from company. Assign another SUPER_ADMIN first.");
        }
        log.warn("Removing SUPER_ADMIN user {} from company {}", userId, companyId);
    }
    
    @Transactional(readOnly = true)
    public List<CompanyResponse> getUserCompanies(UUID userId) {
        return companyUserRepository.findByUserUserId(userId)
                .stream()
                .map(cu -> buildCompanyResponse(cu.getCompany(), cu.getRole()))
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public CompanyResponse getCompanyById(UUID companyId, UUID userId) {
        CompanyUser companyUser = companyUserRepository.findByUserUserIdAndCompanyCompanyId(userId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("User does not have access to this company"));
        
        return buildCompanyResponse(companyUser.getCompany(), companyUser.getRole());
    }
    
    @Transactional(readOnly = true)
    public byte[] getCompanyLogo(UUID companyId, UUID userId) {
        companyUserRepository.findByUserUserIdAndCompanyCompanyId(userId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("User does not have access to this company"));
        
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        
        return company.getLogo();
    }
    
    public CompanyResponse updateCompany(UUID companyId, UpdateCompanyRequest request, UUID userId) {
        requireSuperAdmin(userId, companyId);
        
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        
        if (request.getDescription() != null) company.setDescription(request.getDescription());
        if (request.getAddressLine1() != null) company.setAddressLine1(request.getAddressLine1());
        if (request.getAddressLine2() != null) company.setAddressLine2(request.getAddressLine2());
        if (request.getCity() != null) company.setCity(request.getCity());
        if (request.getState() != null) company.setState(request.getState());
        if (request.getCountry() != null) company.setCountry(request.getCountry());
        if (request.getPinCode() != null) company.setPinCode(request.getPinCode());
        if (request.getContactNumber() != null) company.setContactNumber(request.getContactNumber());
        
        if (request.getLogo() != null && !request.getLogo().isEmpty()) {
            if (request.getLogo().getSize() > MAX_FILE_SIZE) {
                throw new IllegalArgumentException("Logo size must not exceed 50KB");
            }
            try {
                company.setLogo(request.getLogo().getBytes());
            } catch (Exception e) {
                log.warn("Failed to upload logo", e);
            }
        }
        
        company = companyRepository.save(company);
        log.info("Company updated: {} by user: {}", company.getName(), userId);
        
        CompanyUser companyUser = companyUserRepository.findByUserUserIdAndCompanyCompanyId(userId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("User does not have access to this company"));
        
        return buildCompanyResponse(company, companyUser.getRole());
    }
    
    private CompanyResponse buildCompanyResponse(Company company, CompanyRole role) {
        return CompanyResponse.builder()
                .companyId(company.getCompanyId())
                .name(company.getName())
                .urlSlug(company.getUrlSlug())
                .description(company.getDescription())
                .addressLine1(company.getAddressLine1())
                .addressLine2(company.getAddressLine2())
                .city(company.getCity())
                .state(company.getState())
                .country(company.getCountry())
                .pinCode(company.getPinCode())
                .contactNumber(company.getContactNumber())
                .hasLogo(company.getLogo() != null)
                .createdBy(company.getCreatedBy())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .active(company.isActive())
                .userRole(role)
                .build();
    }
    
    private String generateUrlSlug(String companyName) {
        String slug = companyName.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        
        String baseSlug = slug;
        int counter = 1;
        while (companyRepository.countByUrlSlug(slug) > 0) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        return slug;
    }
    
    private void requireSuperAdmin(UUID userId, UUID companyId) {
        companyUserRepository.findByUserUserIdAndCompanyCompanyId(userId, companyId)
                .filter(cu -> cu.getRole() == CompanyRole.SUPER_ADMIN)
                .orElseThrow(() -> new IllegalArgumentException("Only SUPER_ADMIN can perform this action"));
    }
}
