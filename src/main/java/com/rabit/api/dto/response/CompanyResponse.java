package com.rabit.api.dto.response;

import com.rabit.api.model.enums.CompanyRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyResponse {

    private UUID companyId;

    private String name;

    private String urlSlug;

    private String description;

    private String addressLine1;

    private String addressLine2;

    private String city;

    private String state;

    private String country;

    private String pinCode;

    private String contactNumber;

    private boolean hasLogo;

    private String logoUrl;

    private UUID createdBy;

    private Instant createdAt;

    private Instant updatedAt;

    private boolean active;

    private CompanyRole userRole;

    private String message;
}
