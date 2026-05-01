package com.ssafy.ttocket.voucher.service;

import com.ssafy.ttocket.voucher.dto.CommonResponse;
import com.ssafy.ttocket.voucher.entity.VoucherUser;
import com.ssafy.ttocket.voucher.repository.VoucherUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service("voucherUserService")
@RequiredArgsConstructor
public class UserService {

    private final VoucherUserRepository voucherUserRepository;

    /**
     * 지갑 주소로 사용자 조회
     * 존재하면 nickname 반환, 없으면 status_code 400
     */
    @Transactional(readOnly = true, transactionManager = "voucherTransactionManager")
    public CommonResponse<?> checkUser(String walletAddress) {
        Optional<VoucherUser> userOpt = voucherUserRepository.findByWalletAddress(walletAddress);

        if (userOpt.isEmpty()) {
            log.info("사용자 없음: walletAddress={}", walletAddress);
            return CommonResponse.error(400, "사용자를 찾을 수 없습니다.");
        }

        Map<String, String> body = new HashMap<>();
        body.put("walletAddress", userOpt.get().getWalletAddress());
        body.put("nickname", userOpt.get().getNickname());

        log.info("사용자 조회 성공: walletAddress={}, nickname={}", walletAddress, userOpt.get().getNickname());
        return CommonResponse.success(body);
    }

    /**
     * 닉네임 등록 (신규) 또는 업데이트
     */
    @Transactional(transactionManager = "voucherTransactionManager")
    public CommonResponse<?> registerNickname(String walletAddress, String nickname) {
        VoucherUser user = voucherUserRepository.findByWalletAddress(walletAddress)
                .orElse(VoucherUser.builder()
                        .walletAddress(walletAddress)
                        .build());

        user.setNickname(nickname);
        voucherUserRepository.save(user);

        Map<String, String> body = new HashMap<>();
        body.put("walletAddress", walletAddress);
        body.put("nickname", nickname);

        log.info("닉네임 등록/업데이트 완료: walletAddress={}, nickname={}", walletAddress, nickname);
        return CommonResponse.success(body);
    }
}
