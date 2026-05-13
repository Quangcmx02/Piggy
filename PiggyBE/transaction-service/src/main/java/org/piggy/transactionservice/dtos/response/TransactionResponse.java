package org.piggy.transactionservice.dtos.response;

import lombok.Builder;
import lombok.Data;
import org.piggy.transactionservice.constant.TransactionType;
import org.piggy.transactionservice.entity.Transaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class TransactionResponse {
    private String id;
    private Long walletId;
    private Long targetWalletId;
    private String walletName;
    private String targetWalletName;
    private String categoryName;
    private TransactionType type;
    private BigDecimal amount;
    private String note;
    private LocalDateTime transactionDate;

    public static TransactionResponse fromEntity(Transaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .walletId(tx.getWallet().getId())
                .targetWalletId(tx.getTargetWallet() != null ? tx.getTargetWallet().getId() : null)
                .walletName(tx.getWallet().getName())
                .targetWalletName(tx.getTargetWallet() != null ? tx.getTargetWallet().getName() : null)
                .categoryName(tx.getCategory().getName())
                .type(tx.getCategory().getType())
                .amount(tx.getAmount())
                .note(tx.getNote())
                .transactionDate(tx.getTransactionDate())
                .build();
    }
}