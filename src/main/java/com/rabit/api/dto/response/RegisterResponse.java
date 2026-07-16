package com.rabit.api.dto.response;

import com.rabit.api.model.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterResponse {

    private UUID userId;

    private String username;

    private String email;

    private String firstName;

    private String lastName;

    private UserStatus status;

    private String message;
}
