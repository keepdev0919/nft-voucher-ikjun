package com.ssafy.ttocket.voucher.controller;

import com.ssafy.ttocket.voucher.dto.CommonResponse;
import com.ssafy.ttocket.voucher.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 바우처 API
 * Base: /voucher/voucher
 */
@Slf4j
@RestController("voucherVoucherController")
@RequestMapping("/voucher/voucher")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class VoucherController {

    private final VoucherService voucherService;

    /**
     * GET /voucher/voucher/my/{walletAddress}
     * 내 바우처 목록 조회 (status 숫자 그대로)
     */
    @GetMapping("/my/{walletAddress}")
    public ResponseEntity<CommonResponse<?>> getMyVouchers(@PathVariable String walletAddress) {
        log.info("[GET] /voucher/voucher/my/{}", walletAddress);
        CommonResponse<?> response = voucherService.getMyVouchers(walletAddress);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /voucher/voucher/history/{walletAddress}
     * 바우처 사용 내역 조회
     */
    @GetMapping("/history/{walletAddress}")
    public ResponseEntity<CommonResponse<?>> getVoucherHistory(@PathVariable String walletAddress) {
        log.info("[GET] /voucher/voucher/history/{}", walletAddress);
        CommonResponse<?> response = voucherService.getVoucherHistory(walletAddress);
        return ResponseEntity.ok(response);
    }
}
