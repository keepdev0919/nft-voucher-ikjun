package com.ssafy.ttocket.voucher.controller;

import com.ssafy.ttocket.voucher.dto.CommonResponse;
import com.ssafy.ttocket.voucher.dto.MerchantUseDto;
import com.ssafy.ttocket.voucher.service.MerchantService;
import com.ssafy.ttocket.voucher.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 가맹점 API
 * Base: /voucher/merchant
 */
@Slf4j
@RestController("voucherMerchantController")
@RequestMapping("/voucher/merchant")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class MerchantController {

    private final MerchantService merchantService;
    private final VoucherService voucherService;

    /**
     * GET /voucher/merchant/list
     * 가맹점 목록 조회
     */
    @GetMapping("/list")
    public ResponseEntity<CommonResponse<?>> getMerchantList() {
        log.info("[GET] /voucher/merchant/list");
        CommonResponse<?> response = merchantService.getMerchantList();
        return ResponseEntity.ok(response);
    }

    /**
     * POST /voucher/merchant/register
     * 가맹점 등록 신청
     * body: { walletAddress, name, category }
     */
    @PostMapping("/register")
    public ResponseEntity<CommonResponse<?>> registerMerchant(@RequestBody MerchantUseDto.RegisterRequest request) {
        log.info("[POST] /voucher/merchant/register walletAddress={}, name={}", request.getWalletAddress(), request.getName());

        if (request.getWalletAddress() == null || request.getWalletAddress().isBlank()) {
            return ResponseEntity.ok(CommonResponse.error(400, "walletAddress가 필요합니다."));
        }
        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.ok(CommonResponse.error(400, "name이 필요합니다."));
        }

        CommonResponse<?> response = merchantService.registerMerchant(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /voucher/merchant/verify/{tokenId}
     * 바우처 검증 — isValid, ownerName, amount, expiryDate 반환
     */
    @GetMapping("/verify/{tokenId}")
    public ResponseEntity<CommonResponse<?>> verifyVoucher(@PathVariable Long tokenId) {
        log.info("[GET] /voucher/merchant/verify/{}", tokenId);
        CommonResponse<?> response = voucherService.verifyVoucher(tokenId);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /voucher/merchant/use
     * 바우처 사용 처리
     * body: { tokenId, merchantWallet, usedAmount, txHash(optional) }
     * header: X-Tx-Hash (body txHash 없을 때 사용)
     *
     * idempotency: txHash 중복이면 200 반환 (재처리 없음)
     */
    @PostMapping("/use")
    public ResponseEntity<CommonResponse<?>> useVoucher(
            @RequestBody MerchantUseDto.UseRequest request,
            @RequestHeader(value = "X-Tx-Hash", required = false) String headerTxHash) {

        log.info("[POST] /voucher/merchant/use tokenId={}, merchantWallet={}, usedAmount={}, txHash(body)={}, txHash(header)={}",
                request.getTokenId(), request.getMerchantWallet(), request.getUsedAmount(),
                request.getTxHash(), headerTxHash);

        if (request.getTokenId() == null) {
            return ResponseEntity.ok(CommonResponse.error(400, "tokenId가 필요합니다."));
        }
        if (request.getMerchantWallet() == null || request.getMerchantWallet().isBlank()) {
            return ResponseEntity.ok(CommonResponse.error(400, "merchantWallet이 필요합니다."));
        }
        if (request.getUsedAmount() == null) {
            return ResponseEntity.ok(CommonResponse.error(400, "usedAmount가 필요합니다."));
        }

        CommonResponse<?> response = merchantService.useVoucher(request, headerTxHash);
        return ResponseEntity.ok(response);
    }
}
