package com.ssafy.ttocket.voucher.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ProgramDto {

    /**
     * 프로그램 생성 요청 DTO
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreateRequest {
        private String name;
        private BigDecimal amount;
        private LocalDate expiryDate;
        private Integer totalSupply;
        private String category;
        private String issuerWallet;
    }

    /**
     * 프로그램 목록 응답 DTO (remainCount 포함)
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ListResponse {
        private Long programId;
        private String name;
        private BigDecimal amount;
        private LocalDate expiryDate;
        private Integer totalSupply;
        private String category;
        private String issuerWallet;

        @JsonProperty("remain_count")
        private long remainCount;
    }
}
