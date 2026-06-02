package org.piggy.identityservice.dtos.request;

import lombok.Data;

@Data
public class UpdateUserStatusRequest {
    private boolean active;
}
