package org.piggy.transactionservice.dtos.request;

import lombok.Data;

import java.math.BigDecimal;
@Data
public class WalletRequest {
    private String name;
    private BigDecimal initialBalance; // Số dư ban đầu
    private String currency; // Tùy chọn, mặc định có thể là "VND"
}
