package org.piggy.identityservice.controller;

import lombok.RequiredArgsConstructor;
import org.piggy.common.model.ResponseModel;
import org.piggy.identityservice.dtos.request.LoginRequest;
import org.piggy.identityservice.dtos.request.LogoutRequest;
import org.piggy.identityservice.dtos.request.RegisterRequest;
import org.piggy.identityservice.dtos.request.TokenRefreshRequest;
import org.piggy.identityservice.dtos.response.LoginResponse;
import org.piggy.identityservice.dtos.response.TokenRefreshResponse;
import org.piggy.identityservice.dtos.response.UserResponse;
import org.springframework.web.bind.annotation.*;
import org.piggy.identityservice.services.IUserService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IUserService userService;

    @PostMapping("/register")
    public ResponseModel<UserResponse> register(@RequestBody RegisterRequest request) {
        UserResponse result = userService.register(request);
        return ResponseModel.successResponse(result);
    }

    @PostMapping("/login")
    public ResponseModel<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse result = userService.login(request);
        return ResponseModel.successResponse(result);
    }

    @PostMapping("/refresh-token")
    public ResponseModel<TokenRefreshResponse> refreshToken(@RequestBody TokenRefreshRequest request) {
        TokenRefreshResponse result = userService.refreshToken(request);
        return ResponseModel.successResponse(result);
    }

    @PostMapping("/logout")
    public ResponseModel<Void> logout(@RequestBody LogoutRequest request) {
        userService.logout(request);
        return ResponseModel.successResponse(null);
    }
}
