package com.rabbit.api.controller;

import com.rabbit.api.dto.response.DashboardResponse;
import com.rabbit.api.security.JwtUserContext;
import com.rabbit.api.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(Authentication authentication) {
        JwtUserContext userContext = (JwtUserContext) authentication;
        DashboardResponse response = dashboardService.getDashboard(userContext.getUserId());
        return ResponseEntity.ok(response);
    }
}
