package com.voucher.dto.response;

import com.voucher.domain.PaymentSession;
import com.voucher.domain.enums.PaymentSessionStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PaymentStatusResponse {

    private String paymentId;
    private PaymentSessionStatus status;
    private String txHash;
    private LocalDateTime completedAt;

    public static PaymentStatusResponse from(PaymentSession s) {
        return PaymentStatusResponse.builder()
                .paymentId(s.getPaymentId())
                .status(s.getStatus())
                .txHash(s.getTxHash())
                .completedAt(s.getCompletedAt())
                .build();
    }
}
