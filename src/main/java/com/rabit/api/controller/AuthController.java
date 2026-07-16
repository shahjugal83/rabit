package com.rabit.api.controller;

import com.rabit.api.dto.request.LoginRequest;
import com.rabit.api.dto.request.RegisterRequest;
import com.rabit.api.dto.request.VerifyEmailRequest;
import com.rabit.api.dto.response.LoginResponse;
import com.rabit.api.dto.response.PublicConfigResponse;
import com.rabit.api.dto.response.RegisterResponse;
import com.rabit.api.dto.response.UserMeResponse;
import com.rabit.api.dto.response.VerifyEmailResponse;
import com.rabit.api.security.JwtUserContext;
import com.rabit.api.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    @Value("${app.oauth2.google.enabled:false}")
    private boolean googleEnabled;

    @GetMapping("/config")
    public ResponseEntity<PublicConfigResponse> getConfig() {
        return ResponseEntity.ok(PublicConfigResponse.builder()
                .google(PublicConfigResponse.GoogleConfig.builder()
                        .enabled(googleEnabled)
                        .build())
                .build());
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authenticationService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<VerifyEmailResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        VerifyEmailResponse response = authenticationService.verifyEmail(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authenticationService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserMeResponse> getMe(Authentication authentication) {
        JwtUserContext userContext = (JwtUserContext) authentication;
        UserMeResponse response = authenticationService.getMe(userContext.getUserId());
        return ResponseEntity.ok(response);
    }

    @Profile("local")
    @PostMapping("/test/verify-email")
    public ResponseEntity<?> forceVerifyEmail(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "email required"));
        }
        authenticationService.forceVerifyEmail(email);
        return ResponseEntity.ok(Map.of("message", "User " + email + " verified"));
    }
}
