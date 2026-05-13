package org.piggy.identityservice.controller;

import lombok.RequiredArgsConstructor;
import org.piggy.common.model.ResponseModel;
import org.piggy.identityservice.dtos.response.UserResponse;
import org.springframework.web.bind.annotation.*;
import org.piggy.identityservice.services.IUserService;

import org.piggy.identityservice.dtos.request.UpdateProfileRequest;
import org.piggy.identityservice.dtos.request.ChangePasswordRequest;
import org.piggy.identityservice.dtos.request.ForgotPasswordRequest;
import jakarta.validation.Valid;


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final IUserService userService;

    @GetMapping("/me")
    public ResponseModel<UserResponse> getMyProfile() {
        UserResponse result = userService.getMyProfile();
        return ResponseModel.successResponse(result);
    }

    @PutMapping("/me")
    public ResponseModel<UserResponse> updateProfile(@RequestBody UpdateProfileRequest request) {
        UserResponse result = userService.updateProfile(request);
        return ResponseModel.successResponse(result);
    }

    @PutMapping("/me/password")
    public ResponseModel<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseModel.successResponse("Thay đổi mật khẩu thành công");
    }

    @PostMapping("/forgot-password")
    public ResponseModel<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        userService.forgotPassword(request);
        return ResponseModel.successResponse("Đã gửi mật khẩu tạm thời vào email của bạn");
    }

    @GetMapping("/{id}")

    public ResponseModel<UserResponse> getUser(@PathVariable String id) {
        UserResponse result = userService.getUserById(id);
        return ResponseModel.successResponse(result);
    }
}