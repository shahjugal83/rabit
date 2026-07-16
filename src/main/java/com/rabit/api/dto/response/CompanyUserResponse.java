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
public class CompanyUserResponse {

    private UUID userId;

    private String email;

    private String firstName;

    private String lastName;

    private CompanyRole role;

    private boolean active;

    private Instant createdAt;

    private String message;
}
