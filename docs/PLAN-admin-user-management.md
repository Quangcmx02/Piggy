# PLAN: Admin User Management
**File:** `docs/PLAN-admin-user-management.md`
**Task Slug:** `admin-user-management`
**Created:** 2026-05-25
**Status:** 🟢 Implemented — chờ verify

---

## 📋 Overview

Triển khai tính năng quản lý người dùng dành cho Admin trong hệ thống Piggy, bao gồm:

1. **Backend – Kiểm tra `active` khi đăng nhập**: Nếu `active = false`, chặn đăng nhập với thông báo "Tài khoản đã bị khóa".
2. **Backend – `AdminController` riêng**: Tách biệt hoàn toàn các API dành cho Admin (xem danh sách, khóa/mở tài khoản) ra khỏi `UserController` thông thường.
3. **Frontend – Trang Admin User Management**: Giao diện bảng danh sách người dùng, cho phép xem thông tin, khóa/mở khóa tài khoản.

---

## 🎯 Success Criteria

- [ ] User đăng nhập với `active = false` → nhận lỗi rõ ràng "Tài khoản đã bị khóa"
- [ ] Admin có thể xem danh sách tất cả người dùng qua `GET /api/admin/users`
- [ ] Admin có thể khóa/mở khóa tài khoản qua `PATCH /api/admin/users/{id}/active`
- [ ] Non-admin không thể truy cập `/api/admin/**` → nhận 403 Forbidden
- [ ] Frontend route `/admin/users` chỉ hiện với user có role ADMIN
- [ ] Toggle khóa/mở trong UI hoạt động và cập nhật ngay tức thì (Optimistic UI)

---

## 🏗️ Project Type

**WEB** – Full-stack (Spring Boot Backend + React/TypeScript Frontend)

---

## 🛠️ Tech Stack

| Layer | Technology | Ghi chú |
|-------|-----------|---------|
| Backend | Spring Boot 3, Spring Security | `@PreAuthorize`, `@EnableMethodSecurity` đã bật |
| Auth | JWT + Spring Security | `CustomUserDetailsService` load user |
| Database | JPA/Hibernate | Entity `User` đã có field `active` |
| Frontend | React + TypeScript + MUI | Axios interceptors đã có sẵn |
| HTTP Client | Axios (`base.api.ts`) | Interceptor auth token đã setup |

---

## 📁 File Structure (Thay đổi & Thêm mới)

```
PiggyBE/identity-service/src/main/java/org/piggy/identityservice/
├── controller/
│   ├── AuthController.java           (GIỮ NGUYÊN – login check active qua Spring Security)
│   ├── UserController.java           (GIỮ NGUYÊN)
│   └── AdminController.java          ✅ TẠO MỚI
├── services/
│   ├── IUserService.java             (SỬA: thêm admin methods)
│   └── UserServiceImpl.java          (SỬA: thêm active check + admin logic)
├── dtos/
│   └── request/
│       └── UpdateUserStatusRequest.java  ✅ TẠO MỚI
│   └── response/
│       └── AdminUserResponse.java        ✅ TẠO MỚI
└── config/
    ├── SecurityConfig.java           (SỬA: thêm rule /api/admin/** hasRole ADMIN)
    └── CustomUserDetailsService.java (SỬA: thêm .disabled(!user.isActive()))

PiggyFE/src/
├── api/
│   └── admin.api.ts                  ✅ TẠO MỚI
├── pages/
│   └── admin/
│       └── UserManagement.tsx        ✅ TẠO MỚI
├── routes/
│   └── AppRoutes.tsx                 (SỬA: thêm AdminRoute + /admin/users)
└── components/
    └── AdminRoute.tsx                ✅ TẠO MỚI
```

---

## 📌 Task Breakdown

### PHASE 0: Backend – Active Check on Login

---

#### TASK-01: Kiểm tra `active` trong `CustomUserDetailsService`
- **Agent:** `backend-specialist`
- **Skill:** `clean-code`
- **Priority:** P0 (blocker cho toàn bộ)
- **Dependencies:** none
- **Effort:** ~5 phút

**INPUT:**
- `CustomUserDetailsService.java` – hiện không check `user.isActive()`
- Spring Security tự ném `DisabledException` nếu `UserDetails.isEnabled()` trả `false`

**OUTPUT – Sửa `CustomUserDetailsService.java`:**
```java
return org.springframework.security.core.userdetails.User.builder()
        .username(user.getUsername())
        .password(user.getPasswordHash())
        .disabled(!user.isActive())   // THÊM: user bị khóa sẽ không đăng nhập được
        .authorities(user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                .collect(Collectors.toList()))
        .build();
```

**OUTPUT – Sửa `UserServiceImpl.java` (login method catch block):**
```java
} catch (DisabledException e) {
    throw new CustomException(ExceptionErrorCode.FORBIDDEN, "Tài khoản đã bị khóa");
} catch (Exception e) {
    throw new CustomException(ExceptionErrorCode.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu");
}
```

**VERIFY:**
- Login với user `active=false` → HTTP 403, message "Tài khoản đã bị khóa"
- Login với user `active=true` → Login thành công như cũ

---

### PHASE 1: Backend – Admin DTOs & Service Methods

---

#### TASK-02: Tạo `AdminUserResponse` DTO
- **Agent:** `backend-specialist`
- **Skill:** `clean-code`
- **Priority:** P1
- **Dependencies:** TASK-01

**OUTPUT – Tạo file `AdminUserResponse.java`:**
```java
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
```

**VERIFY:** Compile OK, `fromEntity()` map đúng fields

---

#### TASK-03: Tạo `UpdateUserStatusRequest` DTO
- **Agent:** `backend-specialist`
- **Priority:** P1
- **Dependencies:** TASK-02

**OUTPUT – Tạo file `UpdateUserStatusRequest.java`:**
```java
package org.piggy.identityservice.dtos.request;

import lombok.Data;

@Data
public class UpdateUserStatusRequest {
    private boolean active;
}
```

---

#### TASK-04: Thêm Admin methods vào `IUserService` và `UserServiceImpl`
- **Agent:** `backend-specialist`
- **Skill:** `clean-code`
- **Priority:** P1
- **Dependencies:** TASK-02, TASK-03

**OUTPUT – Thêm vào `IUserService.java`:**
```java
List<AdminUserResponse> getAllUsers();
AdminUserResponse updateUserStatus(String userId, UpdateUserStatusRequest request);
```

**OUTPUT – Thêm vào `UserServiceImpl.java`:**
```java
@Override
public List<AdminUserResponse> getAllUsers() {
    return userRepository.findAll().stream()
            .map(AdminUserResponse::fromEntity)
            .collect(Collectors.toList());
}

@Override
@Transactional
public AdminUserResponse updateUserStatus(String userId, UpdateUserStatusRequest request) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy user"));
    // Guard: admin không tự khóa chính mình
    String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
    if (user.getUsername().equals(currentUsername) && !request.isActive()) {
        throw new CustomException(ExceptionErrorCode.FORBIDDEN, "Admin không thể tự khóa tài khoản của mình");
    }
    user.setActive(request.isActive());
    userRepository.save(user);
    return AdminUserResponse.fromEntity(user);
}
```

**VERIFY:** Compile OK, methods xuất hiện đúng trong interface

---

### PHASE 2: Backend – AdminController & SecurityConfig

---

#### TASK-05: Tạo `AdminController.java`
- **Agent:** `backend-specialist`
- **Skill:** `clean-code`
- **Priority:** P2
- **Dependencies:** TASK-04

**OUTPUT – Tạo file `AdminController.java`:**
```java
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

    @GetMapping("/users")
    public ResponseModel<List<AdminUserResponse>> getAllUsers() {
        return ResponseModel.successResponse(userService.getAllUsers());
    }

    @PatchMapping("/users/{id}/active")
    public ResponseModel<AdminUserResponse> updateUserStatus(
            @PathVariable String id,
            @RequestBody UpdateUserStatusRequest request) {
        return ResponseModel.successResponse(userService.updateUserStatus(id, request));
    }
}
```

> **Lưu ý:** `@PreAuthorize("hasRole('ADMIN')")` ở class-level = áp dụng tất cả methods.
> Spring Security: `ROLE_ADMIN` ↔ `hasRole('ADMIN')` (tự thêm prefix `ROLE_`).

**VERIFY:** Compile OK, gọi `/api/admin/users` với USER token → 403

---

#### TASK-06: Cập nhật `SecurityConfig.java`
- **Agent:** `backend-specialist`
- **Priority:** P2
- **Dependencies:** TASK-05

**OUTPUT – Thêm rule defense-in-depth vào `authorizeHttpRequests`:**
```java
.requestMatchers("/api/admin/**").hasRole("ADMIN")  // thêm trước .anyRequest()
```

**VERIFY:**
- Non-admin → 403 Forbidden
- Admin → đi qua filter, check `@PreAuthorize` pass → 200

---

### PHASE 3: Frontend – API Layer & UI

---

#### TASK-07: Tạo `admin.api.ts`
- **Agent:** `frontend-specialist`
- **Skill:** `clean-code`
- **Priority:** P3
- **Dependencies:** TASK-05, TASK-06

**OUTPUT – Tạo `src/api/admin.api.ts`:**
```typescript
import axiosClient from "./base.api";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  roles: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const ADMIN_URL = "/api/admin";

export const adminApi = {
  getAllUsers: async (): Promise<AdminUser[]> => {
    const response = await axiosClient.get<{ code: number; data: AdminUser[] }>(
      `${ADMIN_URL}/users`
    );
    return response.data.data;
  },

  updateUserStatus: async (userId: string, active: boolean): Promise<AdminUser> => {
    const response = await axiosClient.patch<{ code: number; data: AdminUser }>(
      `${ADMIN_URL}/users/${userId}/active`,
      { active }
    );
    return response.data.data;
  },
};
```

---

#### TASK-08: Tạo UI Pages & Update Routes
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Priority:** P3
- **Dependencies:** TASK-07

**OUTPUT A – Tạo `src/components/AdminRoute.tsx`:**
```tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.roles?.includes("ADMIN")) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default AdminRoute;
```

**OUTPUT B – Tạo `src/pages/admin/UserManagement.tsx`:**

Trang quản lý bao gồm:
- **Header**: Title "Quản lý người dùng" + badge tổng số user
- **Bảng MUI Table/DataGrid** với cột:
  - Avatar | Username | Email | Full Name | Roles (MUI Chips) | Trạng thái (Active chip xanh / Locked chip đỏ) | Ngày tạo
- **Cột Trạng thái**: `MUI Switch` toggle Optimistic UI (cập nhật UI trước, rollback nếu API lỗi)
- **Search bar**: lọc theo username hoặc email
- **Filter chips**: Tất cả / Active / Bị khóa
- **Toast notification** (react-toastify đã có) khi thành công/thất bại
- **Loading skeleton** khi fetch

**OUTPUT C – Sửa `AppRoutes.tsx`:**
```tsx
// Thêm import:
import AdminRoute from "../components/AdminRoute";
import UserManagementPage from "../pages/admin/UserManagement";

// Thêm route (ngoài UserLayout):
<Route
  path="/admin/users"
  element={
    <AdminRoute>
      <UserManagementPage />
    </AdminRoute>
  }
/>
```

**OUTPUT D – Thêm Admin link vào Sidebar/Nav:**
- Trong `UserLayout` hoặc Sidebar component, kiểm tra `user?.roles?.includes("ADMIN")`
- Nếu đúng → hiện menu item "Quản lý người dùng" → `/admin/users`

**VERIFY:**
- Non-admin navigate `/admin/users` → redirect `/dashboard`
- Admin thấy bảng user đầy đủ
- Toggle switch → API call → toast success → chip trạng thái cập nhật ngay

---

## 🔗 Task Dependency Graph

```
TASK-01 (active check – CustomUserDetailsService + login)
    └── TASK-02 (AdminUserResponse DTO)
            └── TASK-03 (UpdateUserStatusRequest DTO)
                    └── TASK-04 (IUserService + UserServiceImpl admin methods)
                            └── TASK-05 (AdminController)
                                    └── TASK-06 (SecurityConfig)
                                            └── TASK-07 (admin.api.ts)
                                                        └── TASK-08 (UI + Routes)
```

---

## ⚠️ Risk Areas

| Risk | Mức độ | Giải pháp |
|------|--------|-----------|
| Role prefix: `ROLE_ADMIN` vs `ADMIN` | Medium | `hasRole('ADMIN')` = check `ROLE_ADMIN` tự động |
| Admin tự khóa chính mình | Medium | Guard trong `updateUserStatus()` ở TASK-04 |
| Frontend `user.roles` format | Low | Xác nhận `AuthContext` lưu roles từ JWT đúng format |
| `ExceptionErrorCode.FORBIDDEN` có tồn tại? | Low | Kiểm tra `ExceptionErrorCode` enum, thêm nếu thiếu |

---

## 📦 Phase X: Verification Checklist

> ⚠️ CHƯA CHẠY – chờ implementation hoàn tất

### Backend
- [ ] `mvn compile` thành công, 0 errors
- [ ] `GET /api/admin/users` + ADMIN token → 200, danh sách users
- [ ] `GET /api/admin/users` + USER token → 403 Forbidden
- [ ] `PATCH /api/admin/users/{id}/active` `{"active": false}` → user bị khóa
- [ ] Login với user `active=false` → 403 "Tài khoản đã bị khóa"
- [ ] Admin tự khóa mình → 403 "Admin không thể tự khóa..."

### Frontend
- [ ] `npm run lint` → 0 errors
- [ ] `/admin/users` với non-admin → redirect `/dashboard`
- [ ] `/admin/users` với admin → render bảng đầy đủ
- [ ] Toggle switch → API call → toast success → chip trạng thái cập nhật

### Security
- [ ] `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`

---

## 📋 Implementation Order

Khi chạy `/enhance` hoặc implement:

1. **TASK-01** → Safety fix (ưu tiên cao nhất)
2. **TASK-02 + TASK-03** → DTOs (có thể làm song song)
3. **TASK-04** → Service methods
4. **TASK-05 → TASK-06** → Controller + Security
5. **TASK-07 → TASK-08** → Frontend

---

*Plan created by `project-planner` agent | Piggy Financial Management System*
