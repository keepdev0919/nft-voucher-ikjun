package com.ssafy.ttocket.voucher.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

public class MerchantUseDto {

    /**
     * 가맹점 바우처 사용 요청 DTO
     * txHash: body에 포함하거나 X-Tx-Hash 헤더로 전달
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UseRequest {
        private Long tokenId;
        private String merchantWallet;
        private BigDecimal usedAmount;
        /** X-Tx-Hash 헤더 대신 body에 포함 가능 */
        private String txHash;
    }

    /**
     * 가맹점 등록 요청 DTO
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RegisterRequest {
        private String walletAddress;
        private String name;
        private String category;
    }

    /**
     * 가맹점 목록 응답 DTO
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MerchantResponse {
        private String walletAddress;
        private String name;
        private String category;
    }
}
