package com.rabit.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private UUID userId;

    private String username;

    private String email;

    private String firstName;

    private String lastName;

    private String token;

    private long expiresIn;
}
