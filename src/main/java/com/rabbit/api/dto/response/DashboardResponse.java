package com.rabbit.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {

    private List<CompanySummary> companies;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompanySummary {
        private UUID companyId;

        private String name;

        private String description;

        private String city;

        private String state;

        private String country;

        private Instant createdAt;

        private String userRole;
    }
}
