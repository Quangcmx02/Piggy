package org.piggy.identityservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.piggy.identityservice.util.Constants;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
@Builder
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // Tự động sinh chuỗi ngẫu nhiên
    private String id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    private String fullName;

    private String avatarUrl;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    private Set<String> roles = new HashSet<>();

    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
    public User() {
        this.roles = new HashSet<>();  this.roles.add(Constants.ROLE_USER);
        this.active = true;
    }
    public static User createDefaultAdmin() {
        User admin = new User();

        admin.setUsername(Constants.DEFAULT_ADMIN_USERNAME);
        admin.setEmail(Constants.DEFAULT_ADMIN_EMAIL);
        admin.setPasswordHash(Constants.DEFAULT_ADMIN_PASS);
        admin.setFullName("System Administrator");
        Set<String> roles = new HashSet<>();
        roles.add(Constants.ROLE_USER);
        roles.add(Constants.ROLE_ADMIN);
        admin.setRoles(roles);

        return admin;
    }

    public static User createDefaultUser() {
        User user = new User();
        user.setUsername(Constants.DEFAULT_USER_USERNAME);
        user.setEmail(Constants.DEFAULT_USER_EMAIL);
        user.setPasswordHash(Constants.DEFAULT_USER_PASS);
        user.setFullName("Default Standard User");

        return user;
    }
}