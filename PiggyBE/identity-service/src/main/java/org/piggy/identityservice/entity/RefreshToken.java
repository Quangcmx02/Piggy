package org.piggy.identityservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    @Column(length = 500)
    private String token; // C# [Key] -> Java @Id. Token là khóa chính luôn cũng được.

    @Column(name = "user_id", insertable = false, updatable = false)
    private String userId;

    private LocalDateTime expiryDate;

    private boolean revoked;

    private LocalDateTime createdAt;

    private LocalDateTime revokedAt;

    private String replacedByToken;

    private String reasonRevoked;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    // Helper method check hết hạn
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryDate);
    }

    // Helper check còn hiệu lực không
    public boolean isActive() {
        return !revoked && !isExpired();
    }
}