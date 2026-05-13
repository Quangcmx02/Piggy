package org.piggy.identityservice.dtos.response;

import lombok.Data;
import org.piggy.identityservice.entity.User;

import java.util.HashSet;
import java.util.Set;

@Data
public class UserResponse {
    private String id;
    private String username;
    private String email;
    private String fullName;
    private Set<String> roles;

    // Helper mapper
    public static UserResponse fromEntity(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setRoles(user.getRoles());

        return response;

    }

}