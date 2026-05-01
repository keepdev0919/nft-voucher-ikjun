package com.ssafy.ttocket.voucher.controller;

import com.ssafy.ttocket.voucher.dto.CommonResponse;
import com.ssafy.ttocket.voucher.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 사용자 API
 * Base: /voucher/user
 */
@Slf4j
@RestController("voucherUserController")
@RequestMapping("/voucher/user")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private final UserService userService;

    /**
     * GET /voucher/user/check/{walletAddress}
     * 지갑 주소로 사용자 조회 — nickname 반환, 없으면 400
     */
    @GetMapping("/check/{walletAddress}")
    public ResponseEntity<CommonResponse<?>> checkUser(@PathVariable String walletAddress) {
        log.info("[GET] /voucher/user/check/{}", walletAddress);
        CommonResponse<?> response = userService.checkUser(walletAddress);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /voucher/user/nickname
     * 닉네임 등록
     * body: { walletAddress, nickname }
     */
    @PostMapping("/nickname")
    public ResponseEntity<CommonResponse<?>> registerNickname(@RequestBody Map<String, String> body) {
        String walletAddress = body.get("walletAddress");
        String nickname = body.get("nickname");

        log.info("[POST] /voucher/user/nickname walletAddress={}, nickname={}", walletAddress, nickname);

        if (walletAddress == null || walletAddress.isBlank()) {
            return ResponseEntity.ok(CommonResponse.error(400, "walletAddress가 필요합니다."));
        }
        if (nickname == null || nickname.isBlank()) {
            return ResponseEntity.ok(CommonResponse.error(400, "nickname이 필요합니다."));
        }

        CommonResponse<?> response = userService.registerNickname(walletAddress, nickname);
        return ResponseEntity.ok(response);
    }
}
