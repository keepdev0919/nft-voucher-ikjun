package com.voucher.controller;

import com.voucher.dto.request.CreatePaymentSessionRequest;
import com.voucher.dto.request.MerchantPrepareRequest;
import com.voucher.dto.response.ApiResponse;
import com.voucher.dto.response.PaymentSessionResponse;
import com.voucher.dto.response.PaymentStatusResponse;
import com.voucher.dto.response.UseVoucherPrepareResponse;
import com.voucher.service.PaymentSessionService;
import com.voucher.service.VoucherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Merchant", description = "가맹점 전용 API")
@RestController
@RequestMapping("/api/merchant")
@RequiredArgsConstructor
public class MerchantController {

    private final VoucherService voucherService;
    private final PaymentSessionService paymentSessionService;

    @Operation(summary = "바우처 사용 준비 (QR 스캔)",
            description = "가맹점이 사용자 QR을 스캔한 후 금액을 입력해 호출합니다. "
                    + "반환된 eip712 데이터를 사용자가 MetaMask로 서명 후 POST /api/vouchers/{id}/use를 호출하면 결제가 완료됩니다.")
    @PostMapping("/vouchers/use/prepare")
    public ApiResponse<UseVoucherPrepareResponse> prepareUse(
            @Valid @RequestBody MerchantPrepareRequest request,
            Authentication authentication) {
        String merchantWallet = (String) authentication.getPrincipal();
        return voucherService.merchantPrepareUse(request, merchantWallet);
    }

    @PostMapping("/payment-session")
    @Operation(summary = "결제 세션 생성 (가맹점 QR 흐름)")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PaymentSessionResponse> createPaymentSession(
            @Valid @RequestBody CreatePaymentSessionRequest request,
            Authentication authentication) {
        String merchantWallet = (String) authentication.getPrincipal();
        return paymentSessionService.create(merchantWallet, request.getAmount());
    }

    @GetMapping("/payment-status/{paymentId}")
    @Operation(summary = "결제 세션 상태 조회 (가맹점 폴링)")
    public ApiResponse<PaymentStatusResponse> getPaymentStatus(
            @PathVariable String paymentId,
            Authentication authentication) {
        String merchantWallet = (String) authentication.getPrincipal();
        return paymentSessionService.getStatus(paymentId, merchantWallet);
    }
}
