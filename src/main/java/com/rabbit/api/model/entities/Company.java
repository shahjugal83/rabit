package com.rabbit.api.model.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "companies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Company {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID companyId;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @Column(name = "url_slug", nullable = false, unique = true)
    private String urlSlug;
    
    @Column(length = 5000)
    private String description;
    
    @Column(nullable = false)
    private String addressLine1;
    
    @Column
    private String addressLine2;
    
    @Column(nullable = false)
    private String city;
    
    @Column(nullable = false)
    private String state;
    
    @Column(nullable = false)
    private String country;
    
    @Column(nullable = false)
    private String pinCode;
    
    @Column(nullable = false)
    private String contactNumber;
    
    @Column
    private byte[] logo;
    
    @Column(name = "created_by")
    private UUID createdBy;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    @Column(nullable = false)
    private boolean active;
    
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        active = true;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
