package org.piggy.identityservice.config;

import lombok.AllArgsConstructor;
import org.piggy.identityservice.entity.User;
import org.piggy.identityservice.repository.UserRepository;
import org.piggy.identityservice.util.Constants;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@AllArgsConstructor
public class DbConfig {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner initDatabase() {
        return args -> {
            //  Init Admin
            if (!userRepository.existsByUsername(Constants.DEFAULT_ADMIN_USERNAME)) {
                User admin = User.createDefaultAdmin();
                admin.setPasswordHash(passwordEncoder.encode(Constants.DEFAULT_ADMIN_PASS));
                userRepository.save(admin);
            }

            // Init User
            if (!userRepository.existsByUsername(Constants.DEFAULT_USER_USERNAME)) {
                User user = User.createDefaultUser();
                user.setPasswordHash(passwordEncoder.encode(Constants.DEFAULT_USER_PASS));
                userRepository.save(user);
            }
        };
    }
}
