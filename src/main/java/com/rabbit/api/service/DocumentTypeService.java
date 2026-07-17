package com.rabbit.api.service;

import com.rabbit.api.dto.request.DocumentTypeBulkRequest;
import com.rabbit.api.dto.request.DocumentTypeRequest;
import com.rabbit.api.dto.response.DocumentTypeResponse;
import com.rabbit.api.exception.ResourceNotFoundException;
import com.rabbit.api.exception.UserAlreadyExistsException;
import com.rabbit.api.model.entities.Company;
import com.rabbit.api.model.entities.DocumentType;
import com.rabbit.api.model.enums.CompanyRole;
import com.rabbit.api.repository.CompanyRepository;
import com.rabbit.api.repository.CompanyUserRepository;
import com.rabbit.api.repository.DocumentTypeRepository;
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
public class DocumentTypeService {
    
    private final DocumentTypeRepository documentTypeRepository;
    private final CompanyRepository companyRepository;
    private final CompanyUserRepository companyUserRepository;
    
    public DocumentTypeResponse createDocumentType(UUID companyId, DocumentTypeRequest request, UUID userId) {
        requireSuperAdmin(userId, companyId);
        
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        
        if (documentTypeRepository.countByCompanyCompanyIdAndName(companyId, request.getName()) > 0) {
            throw new UserAlreadyExistsException("Document type already exists: " + request.getName());
        }
        
        DocumentType documentType = DocumentType.builder()
                .company(company)
                .name(request.getName())
                .build();
        
        documentType = documentTypeRepository.save(documentType);
        log.info("Document type created: {} for company: {}", documentType.getName(), company.getName());
        
        return DocumentTypeResponse.builder()
                .documentTypeId(documentType.getDocumentTypeId())
                .name(documentType.getName())
                .build();
    }
    
    public List<DocumentTypeResponse> createBulkDocumentTypes(UUID companyId, DocumentTypeBulkRequest request, UUID userId) {
        requireSuperAdmin(userId, companyId);
        
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        
        List<DocumentType> documentTypes = request.getNames().stream()
                .filter(name -> documentTypeRepository.countByCompanyCompanyIdAndName(companyId, name) == 0)
                .map(name -> DocumentType.builder()
                        .company(company)
                        .name(name)
                        .build())
                .collect(Collectors.toList());
        
        documentTypes = documentTypeRepository.saveAll(documentTypes);
        log.info("Bulk document types created: {} for company: {}", documentTypes.size(), company.getName());
        
        return documentTypes.stream()
                .map(dt -> DocumentTypeResponse.builder()
                        .documentTypeId(dt.getDocumentTypeId())
                        .name(dt.getName())
                        .build())
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<DocumentTypeResponse> getDocumentTypes(UUID companyId, UUID userId) {
        requireSuperAdminOrAdmin(userId, companyId);
        
        return documentTypeRepository.findByCompanyCompanyId(companyId)
                .stream()
                .map(dt -> DocumentTypeResponse.builder()
                        .documentTypeId(dt.getDocumentTypeId())
                        .name(dt.getName())
                        .build())
                .collect(Collectors.toList());
    }
    
    private void requireSuperAdmin(UUID userId, UUID companyId) {
        companyUserRepository.findByUserUserIdAndCompanyCompanyId(userId, companyId)
                .filter(cu -> cu.getRole() == CompanyRole.SUPER_ADMIN)
                .orElseThrow(() -> new IllegalArgumentException("Only SUPER_ADMIN can perform this action"));
    }
    
    private void requireSuperAdminOrAdmin(UUID userId, UUID companyId) {
        companyUserRepository.findByUserUserIdAndCompanyCompanyId(userId, companyId)
                .filter(cu -> cu.getRole() == CompanyRole.SUPER_ADMIN || cu.getRole() == CompanyRole.ADMIN)
                .orElseThrow(() -> new IllegalArgumentException("Insufficient permissions"));
    }
}
