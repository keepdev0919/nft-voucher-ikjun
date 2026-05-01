package com.ssafy.ttocket.voucher.entity;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 가맹점 바우처 사용 로그
 * txHash: 블록체인 트랜잭션 해시 (UNIQUE) — idempotency key
 */
@Entity
@Table(name = "merchant_log")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MerchantLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "token_id", nullable = false)
    private Long tokenId;

    @Column(name = "merchant_wallet", length = 42, nullable = false)
    private String merchantWallet;

    @Column(name = "used_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal usedAmount;

    /**
     * 블록체인 트랜잭션 해시 — 중복 방지용 idempotency key
     * Ethereum tx hash: 0x + 64 hex chars = 66 chars
     */
    @Column(name = "tx_hash", length = 66, unique = true, nullable = false)
    private String txHash;

    @CreationTimestamp
    @Column(name = "used_at", nullable = false, updatable = false)
    private LocalDateTime usedAt;
}
