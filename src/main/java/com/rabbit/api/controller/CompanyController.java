package com.rabbit.api.controller;

import com.rabbit.api.dto.request.AddUserToCompanyRequest;
import com.rabbit.api.dto.request.CreateCompanyRequest;
import com.rabbit.api.dto.request.UpdateCompanyRequest;
import com.rabbit.api.dto.response.CompanyResponse;
import com.rabbit.api.dto.response.CompanyUserResponse;
import com.rabbit.api.security.JwtUserContext;
import com.rabbit.api.service.CompanyService;
import com.rabbit.api.service.CompanyUserService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final CompanyUserService companyUserService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CompanyResponse> createCompany(
            @RequestPart("name") String name,
            @RequestPart(value = "aboutCompany", required = false) String aboutCompany,
            @RequestPart("addressLine1") String addressLine1,
            @RequestPart(value = "addressLine2", required = false) String addressLine2,
            @RequestPart("city") String city,
            @RequestPart("state") String state,
            @RequestPart("country") String country,
            @RequestPart("pinCode") String pinCode,
            @RequestPart("contactNumber") String contactNumber,
            @RequestPart(value = "logo", required = false) MultipartFile logo,
            Authentication authentication) {
        JwtUserContext userContext = (JwtUserContext) authentication;

        CreateCompanyRequest request = new CreateCompanyRequest();
        request.setName(name);
        request.setAboutCompany(aboutCompany);
        request.setAddressLine1(addressLine1);
        request.setAddressLine2(addressLine2);
        request.setCity(city);
        request.setState(state);
        request.setCountry(country);
        request.setPinCode(pinCode);
        request.setContactNumber(contactNumber);
        request.setLogo(logo);

        CompanyResponse response = companyService.createCompany(request, userContext.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<CompanyResponse>> getUserCompanies(Authentication authentication) {
        JwtUserContext userContext = (JwtUserContext) authentication;
        List<CompanyResponse> companies = companyService.getUserCompanies(userContext.getUserId());
        return ResponseEntity.ok(companies);
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<CompanyResponse> getCompany(
            @PathVariable UUID companyId,
            Authentication authentication) {
        JwtUserContext userContext = (JwtUserContext) authentication;
        CompanyResponse company = companyService.getCompanyById(companyId, userContext.getUserId());
        return ResponseEntity.ok(company);
    }

    @GetMapping("/{companyId}/logo")
    public void getCompanyLogo(
            @PathVariable UUID companyId,
            Authentication authentication,
            HttpServletResponse response) throws Exception {
        JwtUserContext userContext = (JwtUserContext) authentication;

        byte[] logo = companyService.getCompanyLogo(companyId, userContext.getUserId());

        if (logo == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "No logo attached to this company");
            return;
        }

        response.setContentType(MediaType.IMAGE_PNG_VALUE);
        response.setContentLength(logo.length);
        response.getOutputStream().write(logo);
        response.getOutputStream().flush();
    }

    @PutMapping(value = "/{companyId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CompanyResponse> updateCompany(
            @PathVariable UUID companyId,
            @RequestPart(value = "description", required = false) String description,
            @RequestPart(value = "addressLine1", required = false) String addressLine1,
            @RequestPart(value = "addressLine2", required = false) String addressLine2,
            @RequestPart(value = "city", required = false) String city,
            @RequestPart(value = "state", required = false) String state,
            @RequestPart(value = "country", required = false) String country,
            @RequestPart(value = "pinCode", required = false) String pinCode,
            @RequestPart(value = "contactNumber", required = false) String contactNumber,
            @RequestPart(value = "logo", required = false) MultipartFile logo,
            Authentication authentication) {
        JwtUserContext userContext = (JwtUserContext) authentication;

        UpdateCompanyRequest request = new UpdateCompanyRequest();
        request.setDescription(description);
        request.setAddressLine1(addressLine1);
        request.setAddressLine2(addressLine2);
        request.setCity(city);
        request.setState(state);
        request.setCountry(country);
        request.setPinCode(pinCode);
        request.setContactNumber(contactNumber);
        request.setLogo(logo);

        CompanyResponse response = companyService.updateCompany(companyId, request, userContext.getUserId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{companyId}/users")
    public ResponseEntity<CompanyUserResponse> addUserToCompany(
            @PathVariable UUID companyId,
            @Valid @RequestBody AddUserToCompanyRequest request,
            Authentication authentication) {
        JwtUserContext userContext = (JwtUserContext) authentication;
        CompanyUserResponse response = companyUserService.addUserToCompany(companyId, request, userContext.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
