package com.rabit.api.config;

import com.rabit.api.model.entities.Company;
import com.rabit.api.model.entities.CompanyUser;
import com.rabit.api.model.entities.User;
import com.rabit.api.model.enums.CompanyRole;
import com.rabit.api.model.enums.UserStatus;
import com.rabit.api.repository.CompanyRepository;
import com.rabit.api.repository.CompanyUserRepository;
import com.rabit.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("local")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CompanyUserRepository companyUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.countByEmail("admin@test.com") > 0) {
            log.info("Test data already exists, skipping initialization");
            return;
        }

        User user = User.builder()
                .username("admin")
                .email("admin@test.com")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .firstName("Test")
                .lastName("Admin")
                .addressLine1("123 Test Street")
                .city("Mumbai")
                .state("Maharashtra")
                .pinCode("400001")
                .country("India")
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build();
        user = userRepository.save(user);
        log.info("Test user created: admin@test.com / Admin@123");

        Company company = Company.builder()
                .name("Test Company")
                .urlSlug("test-company")
                .description("A test company for API development")
                .addressLine1("456 Business Park")
                .city("Mumbai")
                .state("Maharashtra")
                .country("India")
                .pinCode("400002")
                .contactNumber("9876543210")
                .createdBy(user.getUserId())
                .active(true)
                .build();
        company = companyRepository.save(company);
        log.info("Test company created: Test Company");

        CompanyUser companyUser = CompanyUser.builder()
                .user(user)
                .company(company)
                .role(CompanyRole.SUPER_ADMIN)
                .active(true)
                .build();
        companyUserRepository.save(companyUser);
        log.info("Test data initialized: user=admin@test.com, company=Test Company, role=SUPER_ADMIN");
    }
}
