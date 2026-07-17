package com.rabbit.api.repository;

import com.rabbit.api.model.entities.CompanyUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyUserRepository extends JpaRepository<CompanyUser, UUID> {
    
    Optional<CompanyUser> findByUserUserIdAndCompanyCompanyId(UUID userId, UUID companyId);
    
    List<CompanyUser> findByUserUserId(UUID userId);
    
    List<CompanyUser> findByCompanyCompanyId(UUID companyId);
    
    long countByUserUserIdAndCompanyCompanyId(UUID userId, UUID companyId);
    
    @Query("SELECT COUNT(cu) FROM CompanyUser cu WHERE cu.company.companyId = ?1 AND cu.role = 'SUPER_ADMIN' AND cu.active = true")
    long countActiveSuperAdminsByCompanyId(UUID companyId);
}
