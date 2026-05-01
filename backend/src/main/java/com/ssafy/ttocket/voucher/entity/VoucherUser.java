package com.ssafy.ttocket.voucher.entity;

import lombok.*;

import javax.persistence.*;

/**
 * NFT 바우처 사용자 엔티티
 * walletAddress를 PK로 사용
 */
@Entity
@Table(name = "voucher_user")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VoucherUser {

    @Id
    @Column(name = "wallet_address", length = 42, nullable = false)
    private String walletAddress;

    @Column(name = "nickname", length = 50, nullable = false)
    private String nickname;
}
