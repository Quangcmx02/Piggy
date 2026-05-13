package org.piggy.apigateway.filter;

import org.piggy.apigateway.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    @Autowired
    private RouteValidator validator;

    @Autowired
    private JwtUtil jwtUtil;

    public AuthenticationFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return ((exchange, chain) -> {

            // Kiểm tra xem API này có cần bảo mật
            if (validator.isSecured.test(exchange.getRequest())) {

                // THÊM ĐOẠN NÀY: Bỏ qua kiểm tra Token đối với request OPTIONS (Preflight của CORS)
                if (exchange.getRequest().getMethod().name().equals("OPTIONS")) {
                    return chain.filter(exchange);
                }

                // Kiểm tra xem có Header Authorization
                if (!exchange.getRequest().getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                }

                //  Lấy chuỗi token
                String authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION).get(0);
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    authHeader = authHeader.substring(7);
                }


                //  Xác thực Token
                try {
                    //  Kiểm tra xem Token có hợp lệ/hết hạn chưa
                    jwtUtil.validateToken(authHeader);

                    //  Lấy userId, email ra từ Token
                    String userId = jwtUtil.extractUserId(authHeader);
                    String userEmail = jwtUtil.extractUserEmail(authHeader);

                    // . Clone request cũ, nhét thêm Header "X-User-Id" và "X-User-Email" vào
                    org.springframework.http.server.reactive.ServerHttpRequest request = exchange.getRequest()
                            .mutate()
                            .header("X-User-Id", userId)
                            .header("X-User-Email", userEmail)
                            .build();

                    //  Cho request (đã được độ chế) đi tiếp xuống các service bên dưới
                    return chain.filter(exchange.mutate().request(request).build());

                } catch (Exception e) {
                    System.out.println("Token không hợp lệ: " + e.getMessage());
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                }
            }

            return chain.filter(exchange);
        });
    }

    public static class Config {

    }
}