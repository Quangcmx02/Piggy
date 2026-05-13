package org.piggy.identityservice.services;

import org.piggy.common.emums.ExceptionErrorCode;
import org.piggy.common.exception.CustomException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.piggy.identityservice.dtos.request.LoginRequest;
import org.piggy.common.event.NotificationEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import java.util.HashMap;
import java.util.Map;

import org.piggy.identityservice.dtos.request.RegisterRequest;
import org.piggy.identityservice.dtos.request.TokenRefreshRequest;
import org.piggy.identityservice.dtos.response.LoginResponse;
import org.piggy.identityservice.dtos.response.TokenRefreshResponse;
import org.piggy.identityservice.dtos.response.UserResponse;
import org.piggy.identityservice.entity.RefreshToken;
import org.piggy.identityservice.entity.User;
import org.piggy.identityservice.repository.RefreshTokenRepository;
import org.piggy.identityservice.repository.UserRepository;
import org.piggy.identityservice.dtos.request.LogoutRequest;
import java.time.LocalDateTime;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.piggy.identityservice.dtos.request.UpdateProfileRequest;
import org.piggy.identityservice.dtos.request.ChangePasswordRequest;
import org.piggy.identityservice.dtos.request.ForgotPasswordRequest;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class UserServiceImpl implements IUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RabbitTemplate rabbitTemplate;


    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        //  Validate
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new CustomException(ExceptionErrorCode.DUPLICATE_VALUE, "Username đã tồn tại");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ExceptionErrorCode.DUPLICATE_VALUE, "Email đã tồn tại");
        }

        // Map & Logic
        User newUser = new User(); // Constructor tự gán ROLE_USER
        newUser.setUsername(request.getUsername());
        newUser.setEmail(request.getEmail());
        newUser.setFullName(request.getFullName());
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        // 3. Save
        try {
            User savedUser = userRepository.save(newUser);
            
            // Send Welcome Email Notification
            try {
                Map<String, Object> params = new HashMap<>();
                params.put("name", savedUser.getFullName() != null && !savedUser.getFullName().isEmpty() 
                                   ? savedUser.getFullName() : savedUser.getUsername());
                                   
                NotificationEvent emailEvent = NotificationEvent.builder()
                        .recipientEmail(savedUser.getEmail())
                        .subject("Welcome to Piggy!")
                        .templateCode("WELCOME_EMAIL")
                        .params(params)
                        .build();
                        
                rabbitTemplate.convertAndSend("notification.exchange", "notification.routing.key", emailEvent);
            } catch (Exception ex) {
                // Log and ignore to prevent failing the registration
                System.err.println("Failed to send welcome email event: " + ex.getMessage());
            }

            return UserResponse.fromEntity(savedUser);
        } catch (Exception e) {
            throw new CustomException(ExceptionErrorCode.REPOSITORY_ERROR, "Lỗi khi lưu User");
        }
    }


    @Override
    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy user"));
        return UserResponse.fromEntity(user);
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (Exception e) {
            throw new CustomException(ExceptionErrorCode.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy user"));

        String accessToken = jwtService.generateAccessToken(user);
        RefreshToken refreshToken = jwtService.generateRefreshToken(user);

        return LoginResponse.builder()
                .user(UserResponse.fromEntity(user))
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .build();
    }

    @Override
    @Transactional
    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findById(request.getRefreshToken())
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.UNAUTHORIZED, "Refresh token không hợp lệ"));

        if (!refreshToken.isActive()) {
            throw new CustomException(ExceptionErrorCode.UNAUTHORIZED, "Refresh token đã hết hạn hoặc bị thu hồi");
        }

        User user = refreshToken.getUser();
        String accessToken = jwtService.generateAccessToken(user);

        return TokenRefreshResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .build();
    }

    @Override
    @Transactional
    public void logout(LogoutRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findById(request.getRefreshToken())
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Token không tồn tại"));

        if (!refreshToken.isActive()) {
            throw new CustomException(ExceptionErrorCode.UNAUTHORIZED, "Token đã bị thu hồi hoặc hết hạn");
        }

        refreshToken.setRevoked(true);
        refreshToken.setRevokedAt(LocalDateTime.now());
        refreshToken.setReasonRevoked("User logged out");
        
        refreshTokenRepository.save(refreshToken);
    }

    @Override
    public UserResponse getMyProfile() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy user"));
        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy user"));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        userRepository.save(user);
        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy user"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new CustomException(ExceptionErrorCode.UNAUTHORIZED, "Mật khẩu cũ không chính xác");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Email chưa được đăng ký"));

        // Generate a random temporary password
        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        userRepository.save(user);

        // Send Email via RabbitMQ
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("name", user.getFullName() != null && !user.getFullName().isEmpty() 
                               ? user.getFullName() : user.getUsername());
            params.put("tempPassword", tempPassword);

            NotificationEvent emailEvent = NotificationEvent.builder()
                    .recipientEmail(user.getEmail())
                    .subject("Mật khẩu mới của bạn")
                    .templateCode("FORGOT_PASSWORD")
                    .params(params)
                    .build();

            rabbitTemplate.convertAndSend("notification.exchange", "notification.routing.key", emailEvent);
        } catch (Exception ex) {
            System.err.println("Failed to send forgot password email event: " + ex.getMessage());
        }
    }
}