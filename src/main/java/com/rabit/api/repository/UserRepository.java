package com.rabit.api.repository;

import com.rabit.api.model.entities.User;
import com.rabit.api.model.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByUsername(String username);
    
    long countByEmail(String email);
    
    long countByUsername(String username);
}
