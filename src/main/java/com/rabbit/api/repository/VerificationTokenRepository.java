package com.rabbit.api.repository;

import com.rabbit.api.model.entities.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {
    
    Optional<VerificationToken> findByToken(String token);
    
    Optional<VerificationToken> findByUserUserIdAndTokenTypeAndStatus(UUID userId, String tokenType, String status);
    
    void deleteByUserUserId(UUID userId);
}
