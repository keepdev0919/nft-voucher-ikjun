package com.ssafy.ttocket.voucher.entity;

import lombok.*;

import javax.persistence.*;

/**
 * 가맹점 엔티티
 */
@Entity
@Table(name = "merchant")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Merchant {

    @Id
    @Column(name = "wallet_address", length = 42, nullable = false)
    private String walletAddress;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "category", length = 50)
    private String category;
}
