package com.rabit.api.security;

import com.rabit.api.model.entities.User;
import com.rabit.api.model.entities.VerificationToken;
import com.rabit.api.model.enums.UserStatus;
import com.rabit.api.repository.UserRepository;
import com.rabit.api.repository.VerificationTokenRepository;
import com.rabit.api.util.EmailService;
import com.rabit.api.util.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauthUser = oauthToken.getPrincipal();

        String email = oauthUser.getAttribute("email");
        String firstName = oauthUser.getAttribute("given_name");
        String lastName = oauthUser.getAttribute("family_name");

        if (email == null || email.isBlank()) {
            log.error("OAuth2 login failed: no email found in Google response");
            response.sendRedirect(redirectUri + "/login?error=no_email");
            return;
        }

        Optional<User> existingUser = userRepository.findByEmail(email);

        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            log.info("Existing user logged in via Google OAuth: {}", email);
        } else {
            user = User.builder()
                    .username(email)
                    .email(email)
                    .passwordHash("OAUTH_USER_NO_PASSWORD")
                    .firstName(firstName)
                    .lastName(lastName)
                    .status(UserStatus.INACTIVE)
                    .emailVerified(false)
                    .build();
            user = userRepository.save(user);
            log.info("New user created via Google OAuth: {}", email);
        }

        if (!user.isEmailVerified()) {
            String verificationTokenStr = UUID.randomUUID().toString();
            VerificationToken token = VerificationToken.builder()
                    .user(user)
                    .token(verificationTokenStr)
                    .tokenType("EMAIL_VERIFICATION")
                    .status("ACTIVE")
                    .expiryAt(Instant.now().plusSeconds(3600))
                    .build();
            verificationTokenRepository.save(token);
            emailService.sendVerificationEmail(user.getEmail(), verificationTokenStr);
            response.sendRedirect(redirectUri + "/login?message=verification_email_sent&email=" + email);
            return;
        }

        String jwt = jwtTokenProvider.generateToken(user.getUserId(), user.getEmail());
        response.sendRedirect(redirectUri + "/dashboard?token=" + jwt + "&userId=" + user.getUserId());
    }
}
