package org.piggy.identityservice.services;

import org.piggy.identityservice.dtos.request.*;
import org.piggy.identityservice.dtos.response.AdminUserResponse;
import org.piggy.identityservice.dtos.response.LoginResponse;
import org.piggy.identityservice.dtos.response.TokenRefreshResponse;
import org.piggy.identityservice.dtos.response.UserResponse;

import java.util.List;

public interface IUserService {
    UserResponse register(RegisterRequest request);
    UserResponse getUserById(String id);
    LoginResponse login(LoginRequest request);
    TokenRefreshResponse refreshToken(TokenRefreshRequest request);
    void logout(LogoutRequest request);
    UserResponse getMyProfile();
    UserResponse updateProfile(UpdateProfileRequest request);
    void changePassword(ChangePasswordRequest request);
    void forgotPassword(ForgotPasswordRequest request);

    // Admin operations
    List<AdminUserResponse> getAllUsers();
    AdminUserResponse updateUserStatus(String userId, UpdateUserStatusRequest request);
}

