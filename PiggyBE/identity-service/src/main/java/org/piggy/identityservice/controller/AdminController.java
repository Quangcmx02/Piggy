package org.piggy.identityservice.controller;

import lombok.RequiredArgsConstructor;
import org.piggy.common.model.ResponseModel;
import org.piggy.identityservice.dtos.request.UpdateUserStatusRequest;
import org.piggy.identityservice.dtos.response.AdminUserResponse;
import org.piggy.identityservice.services.IUserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final IUserService userService;

    /** GET /api/admin/users — Danh sách tất cả người dùng */
    @GetMapping("/users")
    public ResponseModel<List<AdminUserResponse>> getAllUsers() {
        return ResponseModel.successResponse(userService.getAllUsers());
    }

    /** PATCH /api/admin/users/{id}/active — Khóa hoặc mở khóa tài khoản */
    @PatchMapping("/users/{id}/active")
    public ResponseModel<AdminUserResponse> updateUserStatus(
            @PathVariable String id,
            @RequestBody UpdateUserStatusRequest request) {
        return ResponseModel.successResponse(userService.updateUserStatus(id, request));
    }
}
