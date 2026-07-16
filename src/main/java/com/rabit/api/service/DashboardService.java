package com.rabit.api.service;

import com.rabit.api.dto.response.DashboardResponse;
import com.rabit.api.model.entities.CompanyUser;
import com.rabit.api.repository.CompanyUserRepository;
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
@Transactional(readOnly = true)
public class DashboardService {
    
    private final CompanyUserRepository companyUserRepository;
    
    public DashboardResponse getDashboard(UUID userId) {
        List<CompanyUser> companyUsers = companyUserRepository.findByUserUserId(userId);
        
        List<DashboardResponse.CompanySummary> companies = companyUsers.stream()
                .map(cu -> DashboardResponse.CompanySummary.builder()
                        .companyId(cu.getCompany().getCompanyId())
                        .name(cu.getCompany().getName())
                        .description(cu.getCompany().getDescription())
                        .city(cu.getCompany().getCity())
                        .state(cu.getCompany().getState())
                        .country(cu.getCompany().getCountry())
                        .createdAt(cu.getCompany().getCreatedAt())
                        .userRole(cu.getRole().name())
                        .build())
                .collect(Collectors.toList());
        
        return DashboardResponse.builder()
                .companies(companies)
                .build();
    }
}
