package com.ssafy.ttocket.voucher.controller;

import com.ssafy.ttocket.voucher.dto.CommonResponse;
import com.ssafy.ttocket.voucher.dto.ProgramDto;
import com.ssafy.ttocket.voucher.service.ProgramService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 프로그램 API
 * Base: /voucher/program
 */
@Slf4j
@RestController("voucherProgramController")
@RequestMapping("/voucher/program")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ProgramController {

    private final ProgramService programService;

    /**
     * GET /voucher/program/list
     * 신청 가능한 프로그램 목록 조회 (remainCount 포함)
     */
    @GetMapping("/list")
    public ResponseEntity<CommonResponse<?>> getProgramList() {
        log.info("[GET] /voucher/program/list");
        CommonResponse<?> response = programService.getProgramList();
        return ResponseEntity.ok(response);
    }

    /**
     * POST /voucher/program/create
     * 프로그램 생성
     * body: { name, amount, expiryDate, totalSupply, category, issuerWallet }
     */
    @PostMapping("/create")
    public ResponseEntity<CommonResponse<?>> createProgram(@RequestBody ProgramDto.CreateRequest request) {
        log.info("[POST] /voucher/program/create name={}, issuerWallet={}", request.getName(), request.getIssuerWallet());

        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.ok(CommonResponse.error(400, "name이 필요합니다."));
        }
        if (request.getAmount() == null) {
            return ResponseEntity.ok(CommonResponse.error(400, "amount가 필요합니다."));
        }
        if (request.getExpiryDate() == null) {
            return ResponseEntity.ok(CommonResponse.error(400, "expiryDate가 필요합니다."));
        }
        if (request.getTotalSupply() == null || request.getTotalSupply() <= 0) {
            return ResponseEntity.ok(CommonResponse.error(400, "totalSupply는 1 이상이어야 합니다."));
        }
        if (request.getIssuerWallet() == null || request.getIssuerWallet().isBlank()) {
            return ResponseEntity.ok(CommonResponse.error(400, "issuerWallet이 필요합니다."));
        }

        CommonResponse<?> response = programService.createProgram(request);
        return ResponseEntity.ok(response);
    }
}
