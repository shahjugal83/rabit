package com.rabit.api.repository;

import com.rabit.api.model.entities.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentTypeRepository extends JpaRepository<DocumentType, UUID> {
    
    List<DocumentType> findByCompanyCompanyId(UUID companyId);
    
    long countByCompanyCompanyIdAndName(UUID companyId, String name);
}
