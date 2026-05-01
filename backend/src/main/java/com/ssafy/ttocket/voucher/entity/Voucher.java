package com.ssafy.ttocket.voucher.entity;

import lombok.*;

import javax.persistence.*;

/**
 * NFT 바우처 토큰
 * status: 1 = 보유(활성), 2 = 소진(전액 사용), 3 = 만료
 */
@Entity
@Table(name = "voucher")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Voucher {

    @Id
    @Column(name = "token_id")
    private Long tokenId;

    @Column(name = "program_id", nullable = false)
    private Long programId;

    /**
     * 바우처 보유자 지갑 주소
     */
    @Column(name = "wallet_address", length = 42, nullable = false)
    private String walletAddress;

    /**
     * 상태값: 1=보유(활성), 2=소진, 3=만료
     */
    @Column(name = "status", nullable = false)
    private Integer status;
}
