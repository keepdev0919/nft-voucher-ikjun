package com.ssafy.ttocket.voucher.repository;

import com.ssafy.ttocket.voucher.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    List<Voucher> findByWalletAddressOrderByTokenIdDesc(String walletAddress);

    /**
     * 특정 프로그램의 활성 바우처 수 (status=1) — remainCount 계산용
     */
    long countByProgramIdAndStatus(Long programId, Integer status);

    Optional<Voucher> findByTokenId(Long tokenId);
}
