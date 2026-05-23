package com.voucher.domain;

import com.voucher.domain.enums.PaymentSessionStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_session")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class PaymentSession {

    @Id
    @Column(name = "payment_id", length = 36, nullable = false)
    private String paymentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchant_id", nullable = false)
    private Member merchant;

    @Column(nullable = false)
    private Long amount;

    @Column(nullable = false)
    private Long deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentSessionStatus status;

    @Column(name = "tx_hash", length = 66)
    private String txHash;

    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = PaymentSessionStatus.PENDING;
        }
    }

    public void markCompleted(String txHash) {
        this.status = PaymentSessionStatus.COMPLETED;
        this.txHash = txHash;
        this.completedAt = LocalDateTime.now();
    }

    public void markExpired() {
        this.status = PaymentSessionStatus.EXPIRED;
    }

    public boolean isExpired() {
        return this.deadline < Instant.now().getEpochSecond();
    }
}
