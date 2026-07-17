package com.rabbit.api.dto.request;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCompanyRequest {

    private String description;

    private String addressLine1;

    private String addressLine2;

    private String city;

    private String state;

    private String country;

    @Pattern(regexp = "^[0-9]{6}$", message = "PIN code must be 6 digits")
    private String pinCode;

    @Pattern(regexp = "^[0-9]{10}$", message = "Contact number must be 10 digits")
    private String contactNumber;

    private MultipartFile logo;
}
