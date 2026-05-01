package com.ssafy.ttocket.voucher.repository;

import com.ssafy.ttocket.voucher.entity.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MerchantRepository extends JpaRepository<Merchant, String> {

    List<Merchant> findAllByOrderByNameAsc();

    Optional<Merchant> findByWalletAddress(String walletAddress);
}
