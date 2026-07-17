package com.rabbit.api.controller;

import com.rabbit.api.dto.request.LoginRequest;
import com.rabbit.api.dto.request.RegisterRequest;
import com.rabbit.api.dto.request.VerifyEmailRequest;
import com.rabbit.api.dto.response.LoginResponse;
import com.rabbit.api.dto.response.RegisterResponse;
import com.rabbit.api.dto.response.UserMeResponse;
import com.rabbit.api.dto.response.VerifyEmailResponse;
import com.rabbit.api.security.JwtUserContext;
import com.rabbit.api.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "email required"));
        }
        authenticationService.resendVerificationEmail(email);
        return ResponseEntity.ok(Map.of("message", "Verification email sent"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "email required"));
        }
        authenticationService.forgotPassword(email);
        return ResponseEntity.ok(Map.of("message", "Password reset email sent"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "token required"));
        }
        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "newPassword required"));
        }
        authenticationService.resetPassword(token, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
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
