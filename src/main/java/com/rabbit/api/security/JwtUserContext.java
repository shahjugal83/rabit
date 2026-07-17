package com.rabbit.api.security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.UUID;

public class JwtUserContext extends UsernamePasswordAuthenticationToken {
    
    private final UUID userId;
    private final String email;
    private UUID companyId;
    
    public JwtUserContext(UUID userId, String email, UUID companyId,
                          Collection<? extends GrantedAuthority> authorities) {
        super(userId, null, authorities);
        this.userId = userId;
        this.email = email;
        this.companyId = companyId;
    }
    
    public UUID getUserId() {
        return userId;
    }
    
    public String getEmail() {
        return email;
    }
    
    public UUID getCompanyId() {
        return companyId;
    }
    
    public void setCompanyId(UUID companyId) {
        this.companyId = companyId;
    }
}
