package org.piggy.transactionservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "recurring_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecurringTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(nullable = false)
    private String name; // Tên của giao dịch định kỳ (VD: "Tiền điện", "Thuê nhà")

    @Column(name = "wallet_id", nullable = false)
    private Long walletId; // Trừ/Cộng vào ví nào?

    @Column(name = "category_id", nullable = false)
    private Long categoryId; // Thuộc danh mục nào?

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private org.piggy.transactionservice.constant.RecurringFrequency frequency; // Tần suất (Tháng, Tuần...)

    @Column(nullable = false)
    private LocalDate nextExecutionDate; // Ngày sẽ chạy tiếp theo (Chỉ cần LocalDate)

    @Builder.Default
    private boolean active = true; // User có thể tạm tắt tính năng tự động trừ của khoản này

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
