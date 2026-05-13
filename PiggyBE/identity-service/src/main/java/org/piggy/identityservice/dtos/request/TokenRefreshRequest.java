package org.piggy.identityservice.dtos.request;

import lombok.Data;

@Data
public class TokenRefreshRequest {
    private String refreshToken;
}
