package com.rabit.api.dto.response;

import com.rabit.api.model.enums.CompanyRole;
import com.rabit.api.model.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserMeResponse {

    private UUID userId;

    private String username;

    private String email;

    private String firstName;

    private String lastName;

    private String city;

    private String state;

    private String country;

    private UserStatus status;

    private List<CompanyInfo> companies;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompanyInfo {
        private UUID companyId;

        private String name;

        private CompanyRole role;
    }
}
