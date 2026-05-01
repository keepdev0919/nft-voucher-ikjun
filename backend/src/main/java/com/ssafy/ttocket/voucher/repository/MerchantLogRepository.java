package com.ssafy.ttocket.voucher.repository;

import com.ssafy.ttocket.voucher.entity.MerchantLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MerchantLogRepository extends JpaRepository<MerchantLog, Long> {

    /**
     * txHash 중복 체크 (idempotency)
     */
    Optional<MerchantLog> findByTxHash(String txHash);

    /**
     * 특정 토큰의 사용 내역
     */
    List<MerchantLog> findByTokenIdOrderByUsedAtDesc(Long tokenId);

    /**
     * 특정 지갑 주소 보유자의 전체 사용 내역 조회 (voucher 엔티티와 조인 없이 tokenId 목록으로)
     */
    List<MerchantLog> findByTokenIdInOrderByUsedAtDesc(List<Long> tokenIds);
}
