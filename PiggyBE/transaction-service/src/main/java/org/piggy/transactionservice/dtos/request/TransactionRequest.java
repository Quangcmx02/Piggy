package org.piggy.transactionservice.dtos.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TransactionRequest {
    private Long walletId;
    private Long targetWalletId;
    private Long categoryId;
    private BigDecimal amount;
    private String note;
    private LocalDateTime transactionDate;
}