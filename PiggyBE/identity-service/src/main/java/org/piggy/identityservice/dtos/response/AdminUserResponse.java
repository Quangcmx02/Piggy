package org.piggy.identityservice.dtos.response;

import lombok.*;
import org.piggy.identityservice.entity.User;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {

    private String id;
    private String username;
    private String email;
    private String fullName;
    private String avatarUrl;
    private Set<String> roles;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AdminUserResponse fromEntity(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
