package org.piggy.transactionservice.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "wallets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Wallet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId; // Của ai?

    @Column(nullable = false)
    private String name; // Tiền mặt, Thẻ tín dụng, Vietcombank...

    @Column(nullable = false)
    private BigDecimal balance; // Số dư hiện tại

    private String currency = "VND"; // Mặc định là VND
}