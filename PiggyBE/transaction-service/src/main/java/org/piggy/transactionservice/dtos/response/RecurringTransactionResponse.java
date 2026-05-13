package org.piggy.transactionservice.dtos.response;

import lombok.Builder;
import lombok.Data;
import org.piggy.transactionservice.constant.RecurringFrequency;
import org.piggy.transactionservice.entity.RecurringTransaction;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class RecurringTransactionResponse {
    private Long id;
    private String name;
    private Long walletId;
    private Long categoryId;
    private BigDecimal amount;
    private RecurringFrequency frequency;
    private LocalDate nextExecutionDate;
    private boolean active;

    public static RecurringTransactionResponse fromEntity(RecurringTransaction entity) {
        if (entity == null) return null;
        return RecurringTransactionResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .walletId(entity.getWalletId())
                .categoryId(entity.getCategoryId())
                .amount(entity.getAmount())
                .frequency(entity.getFrequency())
                .nextExecutionDate(entity.getNextExecutionDate())
                .active(entity.isActive())
                .build();
    }
}
