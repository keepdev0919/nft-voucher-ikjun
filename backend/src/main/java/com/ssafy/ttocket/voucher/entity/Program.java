package com.ssafy.ttocket.voucher.entity;

import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * NFT 바우처 프로그램 (발행 단위)
 * - 하나의 프로그램 = 하나의 컨트랙트 발행 단위
 */
@Entity
@Table(name = "program")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Program {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "program_id")
    private Long programId;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    /**
     * 바우처 1장당 금액 (원 단위)
     */
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    /**
     * 총 발행 수량
     */
    @Column(name = "total_supply", nullable = false)
    private Integer totalSupply;

    @Column(name = "category", length = 50)
    private String category;

    /**
     * 발행자 지갑 주소
     */
    @Column(name = "issuer_wallet", length = 42, nullable = false)
    private String issuerWallet;
}
