package org.piggy.apigateway.filter;

import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Predicate;

@Component
public class RouteValidator {

    // SỬA LẠI: Xóa bỏ các ký tự /**
    public static final List<String> openApiEndpoints = List.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/refresh-token",
            "/api/users/forgot-password",
            "/actuator",     // Đã bỏ /**
            "/swagger-ui",   // Đã bỏ /**
            "/fallback",
            "/v3/api-docs"   // Đã bỏ /**
    );

    // SỬA LẠI: Dùng startsWith thay vì contains
    public Predicate<ServerHttpRequest> isSecured =
            request -> openApiEndpoints
                    .stream()
                    .noneMatch(uri -> request.getURI().getPath().startsWith(uri));
}