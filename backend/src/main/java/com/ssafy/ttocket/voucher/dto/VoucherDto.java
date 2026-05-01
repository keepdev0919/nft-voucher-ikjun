package com.ssafy.ttocket.voucher.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class VoucherDto {

    /**
     * 내 바우처 목록 응답 DTO
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MyVoucherResponse {
        private Long tokenId;
        private Long programId;
        private String programName;
        private BigDecimal amount;
        private LocalDate expiryDate;
        private String category;
        /** 상태: 1=보유(활성), 2=소진, 3=만료 */
        private Integer status;
    }

    /**
     * 바우처 사용 내역 응답 DTO
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class HistoryResponse {
        private Long id;
        private Long tokenId;
        private String merchantWallet;
        private String merchantName;
        private BigDecimal usedAmount;
        private String txHash;
        private LocalDateTime usedAt;
    }

    /**
     * 가맹점 바우처 검증 응답 DTO
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class VerifyResponse {
        private Boolean isValid;
        private String ownerName;
        private BigDecimal amount;
        private LocalDate expiryDate;
    }
}
