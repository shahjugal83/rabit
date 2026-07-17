package com.rabbit.api.security;

import com.rabbit.api.repository.CompanyUserRepository;
import com.rabbit.api.util.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtTokenProvider tokenProvider;
    private final CompanyUserRepository companyUserRepository;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (jwt == null) {
                filterChain.doFilter(request, response);
                return;
            }

            if (!tokenProvider.validateToken(jwt)) {
                log.warn("Invalid JWT token provided");
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
                return;
            }

            UUID userId = tokenProvider.getUserIdFromToken(jwt);
            String email = tokenProvider.getEmailFromToken(jwt);

            String companyIdHeader = request.getHeader("X-Company-Id");
            UUID companyId = null;
            List<GrantedAuthority> authorities = new ArrayList<>();

            if (companyIdHeader != null && !companyIdHeader.isBlank()) {
                companyId = UUID.fromString(companyIdHeader);

                boolean hasAccess = companyUserRepository
                        .countByUserUserIdAndCompanyCompanyId(userId, companyId) > 0;
                if (!hasAccess) {
                    log.warn("User {} has no access to company {}", userId, companyId);
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied to this company");
                    return;
                }

                companyUserRepository.findByUserUserIdAndCompanyCompanyId(userId, companyId)
                        .ifPresent(cu -> authorities.add(
                                new SimpleGrantedAuthority("ROLE_" + cu.getRole().name())));
            }

            JwtUserContext authentication = new JwtUserContext(userId, email, companyId, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication failed");
            return;
        }

        filterChain.doFilter(request, response);
    }
    
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
