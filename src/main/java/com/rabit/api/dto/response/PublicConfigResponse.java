package com.rabit.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicConfigResponse {

    private GoogleConfig google;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GoogleConfig {
        private boolean enabled;
    }
}
