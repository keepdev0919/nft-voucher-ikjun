package com.voucher.service;

import com.voucher.domain.Member;
import com.voucher.domain.PaymentSession;
import com.voucher.domain.enums.PaymentSessionStatus;
import com.voucher.domain.enums.Role;
import com.voucher.dto.response.ApiResponse;
import com.voucher.dto.response.PaymentSessionResponse;
import com.voucher.dto.response.PaymentStatusResponse;
import com.voucher.exception.BusinessException;
import com.voucher.exception.ErrorCode;
import com.voucher.repository.MemberRepository;
import com.voucher.repository.PaymentSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentSessionService {

    private final PaymentSessionRepository paymentSessionRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public ApiResponse<PaymentSessionResponse> create(String merchantWallet, Long amount) {
        Member merchant = memberRepository.findByWalletAddress(merchantWallet.toLowerCase())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        if (merchant.getRole() != Role.MERCHANT) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        String paymentId = UUID.randomUUID().toString();
        long deadline = Instant.now().plus(10, ChronoUnit.MINUTES).getEpochSecond();

        PaymentSession session = PaymentSession.builder()
                .paymentId(paymentId)
                .merchant(merchant)
                .amount(amount)
                .deadline(deadline)
                .status(PaymentSessionStatus.PENDING)
                .build();

        PaymentSession saved = paymentSessionRepository.save(session);
        log.info("결제 세션 생성 — paymentId: {}, merchant: {}, amount: {}",
                saved.getPaymentId(), merchant.getWalletAddress(), amount);
        return ApiResponse.success(PaymentSessionResponse.from(saved));
    }

    @Transactional
    public ApiResponse<PaymentStatusResponse> getStatus(String paymentId, String merchantWallet) {
        PaymentSession session = paymentSessionRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_SESSION_NOT_FOUND));

        if (!session.getMerchant().getWalletAddress().equalsIgnoreCase(merchantWallet)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (session.getStatus() == PaymentSessionStatus.PENDING && session.isExpired()) {
            session.markExpired();
            paymentSessionRepository.save(session);
        }

        return ApiResponse.success(PaymentStatusResponse.from(session));
    }

    /**
     * VoucherService.prepareUse 에서 사용하는 검증 헬퍼.
     * paymentId 로 세션을 찾고 상태/만료/가맹점/금액을 검증한 뒤 세션을 반환한다.
     */
    @Transactional
    PaymentSession findAndValidate(String paymentId, String merchantWallet, Long amount) {
        PaymentSession session = paymentSessionRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_SESSION_NOT_FOUND));

        if (session.getStatus() != PaymentSessionStatus.PENDING) {
            throw new BusinessException(ErrorCode.PAYMENT_SESSION_NOT_PENDING);
        }

        if (session.isExpired()) {
            session.markExpired();
            paymentSessionRepository.save(session);
            throw new BusinessException(ErrorCode.PAYMENT_SESSION_EXPIRED);
        }

        if (!session.getMerchant().getWalletAddress().equalsIgnoreCase(merchantWallet)) {
            throw new BusinessException(ErrorCode.PAYMENT_SESSION_MERCHANT_MISMATCH);
        }

        if (!session.getAmount().equals(amount)) {
            throw new BusinessException(ErrorCode.PAYMENT_SESSION_AMOUNT_MISMATCH);
        }

        return session;
    }
}
