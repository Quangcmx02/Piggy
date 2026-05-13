package org.piggy.transactionservice.dtos.response;

import lombok.Builder;
import lombok.Data;
import org.piggy.transactionservice.entity.Wallet;

import java.math.BigDecimal;

@Data
@Builder
public class WalletResponse {
    private Long id;
    private String name;
    private BigDecimal balance;
    private String currency;
    private String userId;

    public static WalletResponse fromEntity(Wallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .name(wallet.getName())
                .balance(wallet.getBalance())
                .currency(wallet.getCurrency())
                .userId(wallet.getUserId())
                .build();
    }
}