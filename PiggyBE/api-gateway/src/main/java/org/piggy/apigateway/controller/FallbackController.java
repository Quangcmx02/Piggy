package org.piggy.apigateway.controller;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @RequestMapping("/identity")
    public Mono<ResponseEntity<Map<String, Object>>> identityServiceFallback() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("code", 503);
        response.put("message", "Hệ thống Tài khoản đang quá tải hoặc bảo trì. Vui lòng thử lại sau ít phút.");

        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response));
    }

    @RequestMapping("/transaction")
    public Mono<ResponseEntity<Map<String, Object>>> transactionServiceFallback() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("code", 503);
        response.put("message", "Hệ thống Giao dịch đang bảo trì. Vui lòng thử lại sau.");

        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response));
    }
}