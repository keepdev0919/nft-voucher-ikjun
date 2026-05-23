package com.voucher.dto.response;

import com.voucher.domain.PaymentSession;
import com.voucher.domain.enums.PaymentSessionStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentSessionResponse {

    private String paymentId;
    private String merchantWallet;
    private Long amount;
    private Long deadline;
    private PaymentSessionStatus status;

    public static PaymentSessionResponse from(PaymentSession s) {
        return PaymentSessionResponse.builder()
                .paymentId(s.getPaymentId())
                .merchantWallet(s.getMerchant().getWalletAddress())
                .amount(s.getAmount())
                .deadline(s.getDeadline())
                .status(s.getStatus())
                .build();
    }
}
