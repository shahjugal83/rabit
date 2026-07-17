package com.rabbit.api.dto.request;

import com.rabbit.api.model.enums.CompanyRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddUserToCompanyRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String firstName;

    private String lastName;

    private String username;

    private String password;

    @NotNull(message = "Role is required")
    private CompanyRole role;
}
