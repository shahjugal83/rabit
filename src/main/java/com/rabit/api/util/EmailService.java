package com.rabit.api.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;
    
    @Value("${app.jwt.verification-expiration:3600000}")
    private long verificationExpiration;
    
    @Async
    public void sendVerificationEmail(String email, String token) {
        try {
            String verificationLink = frontendBaseUrl + "/verify?token=" + token;
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("Email Verification - SaaS Application");
            message.setText("Click the link below to verify your email:\n\n" +
                    verificationLink + "\n\n" +
                    "This link will expire in 1 hour.\n\n" +
                    "If you didn't register, please ignore this email.");
            
            mailSender.send(message);
            log.info("Verification email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send verification email to: {}", email, e);
        }
    }
    
    public void sendPasswordResetEmail(String email, String token) {
        try {
            String resetLink = frontendBaseUrl + "/reset-password?token=" + token;
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("Password Reset - SaaS Application");
            message.setText("Click the link below to reset your password:\n\n" +
                    resetLink + "\n\n" +
                    "This link will expire in 1 hour.\n\n" +
                    "If you didn't request this, please ignore this email.");
            
            mailSender.send(message);
            log.info("Password reset email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", email, e);
        }
    }
}
