package com.ssafy.ttocket.voucher.repository;

import com.ssafy.ttocket.voucher.entity.VoucherUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VoucherUserRepository extends JpaRepository<VoucherUser, String> {

    Optional<VoucherUser> findByWalletAddress(String walletAddress);
}
