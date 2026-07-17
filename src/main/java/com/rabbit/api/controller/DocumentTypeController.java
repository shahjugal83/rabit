package com.rabbit.api.controller;

import com.rabbit.api.dto.request.DocumentTypeBulkRequest;
import com.rabbit.api.dto.request.DocumentTypeRequest;
import com.rabbit.api.dto.response.DocumentTypeResponse;
import com.rabbit.api.security.JwtUserContext;
import com.rabbit.api.service.DocumentTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/companies/{companyId}/document-types")
@RequiredArgsConstructor
public class DocumentTypeController {

    private final DocumentTypeService documentTypeService;

    @PostMapping
    public ResponseEntity<DocumentTypeResponse> createDocumentType(
            @PathVariable UUID companyId,
            @Valid @RequestBody DocumentTypeRequest request,
            Authentication authentication) {
        JwtUserContext userContext = (JwtUserContext) authentication;
        DocumentTypeResponse response = documentTypeService.createDocumentType(companyId, request, userContext.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<DocumentTypeResponse>> createBulkDocumentTypes(
            @PathVariable UUID companyId,
            @Valid @RequestBody DocumentTypeBulkRequest request,
            Authentication authentication) {
        JwtUserContext userContext = (JwtUserContext) authentication;
        List<DocumentTypeResponse> response = documentTypeService.createBulkDocumentTypes(companyId, request, userContext.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<DocumentTypeResponse>> getDocumentTypes(
            @PathVariable UUID companyId,
            Authentication authentication) {
        JwtUserContext userContext = (JwtUserContext) authentication;
        List<DocumentTypeResponse> response = documentTypeService.getDocumentTypes(companyId, userContext.getUserId());
        return ResponseEntity.ok(response);
    }
}
