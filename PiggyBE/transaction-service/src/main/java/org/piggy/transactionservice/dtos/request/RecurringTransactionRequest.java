package org.piggy.transactionservice.dtos.request;

import lombok.Data;
import org.piggy.transactionservice.constant.RecurringFrequency;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class RecurringTransactionRequest {
    private String name;
    private Long walletId;
    private Long categoryId;
    private BigDecimal amount;
    private RecurringFrequency frequency;
    private LocalDate nextExecutionDate;
    private Boolean active;
}
