package com.ssafy.ttocket.voucher.service;

import com.ssafy.ttocket.voucher.dto.CommonResponse;
import com.ssafy.ttocket.voucher.dto.VoucherDto;
import com.ssafy.ttocket.voucher.entity.MerchantLog;
import com.ssafy.ttocket.voucher.entity.Program;
import com.ssafy.ttocket.voucher.entity.Voucher;
import com.ssafy.ttocket.voucher.repository.MerchantLogRepository;
import com.ssafy.ttocket.voucher.repository.MerchantRepository;
import com.ssafy.ttocket.voucher.repository.ProgramRepository;
import com.ssafy.ttocket.voucher.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service("voucherVoucherService")
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final ProgramRepository programRepository;
    private final MerchantLogRepository merchantLogRepository;
    private final MerchantRepository merchantRepository;

    /**
     * 내 바우처 목록 조회
     * status 숫자 그대로 반환: 1=보유(활성), 2=소진, 3=만료
     */
    @Transactional(readOnly = true, transactionManager = "voucherTransactionManager")
    public CommonResponse<?> getMyVouchers(String walletAddress) {
        List<Voucher> vouchers = voucherRepository.findByWalletAddressOrderByTokenIdDesc(walletAddress);

        if (vouchers.isEmpty()) {
            log.info("보유 바우처 없음: walletAddress={}", walletAddress);
            return CommonResponse.success(List.of());
        }

        // 연관된 프로그램 일괄 조회 (N+1 방지)
        List<Long> programIds = vouchers.stream()
                .map(Voucher::getProgramId)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, Program> programMap = programRepository.findAllById(programIds).stream()
                .collect(Collectors.toMap(Program::getProgramId, Function.identity()));

        List<VoucherDto.MyVoucherResponse> responseList = vouchers.stream()
                .map(voucher -> {
                    Program program = programMap.get(voucher.getProgramId());
                    return VoucherDto.MyVoucherResponse.builder()
                            .tokenId(voucher.getTokenId())
                            .programId(voucher.getProgramId())
                            .programName(program != null ? program.getName() : "알 수 없음")
                            .amount(program != null ? program.getAmount() : null)
                            .expiryDate(program != null ? program.getExpiryDate() : null)
                            .category(program != null ? program.getCategory() : null)
                            .status(voucher.getStatus())
                            .build();
                })
                .collect(Collectors.toList());

        log.info("내 바우처 목록 조회: walletAddress={}, count={}", walletAddress, responseList.size());
        return CommonResponse.success(responseList);
    }

    /**
     * 바우처 사용 내역 조회
     */
    @Transactional(readOnly = true, transactionManager = "voucherTransactionManager")
    public CommonResponse<?> getVoucherHistory(String walletAddress) {
        // 해당 지갑의 모든 바우처 조회
        List<Voucher> vouchers = voucherRepository.findByWalletAddressOrderByTokenIdDesc(walletAddress);

        if (vouchers.isEmpty()) {
            return CommonResponse.success(List.of());
        }

        List<Long> tokenIds = vouchers.stream()
                .map(Voucher::getTokenId)
                .collect(Collectors.toList());

        // 해당 토큰들의 사용 로그 조회
        List<MerchantLog> logs = merchantLogRepository.findByTokenIdInOrderByUsedAtDesc(tokenIds);

        List<VoucherDto.HistoryResponse> responseList = logs.stream()
                .map(log -> {
                    String merchantName = merchantRepository.findByWalletAddress(log.getMerchantWallet())
                            .map(m -> m.getName())
                            .orElse(log.getMerchantWallet());

                    return VoucherDto.HistoryResponse.builder()
                            .id(log.getId())
                            .tokenId(log.getTokenId())
                            .merchantWallet(log.getMerchantWallet())
                            .merchantName(merchantName)
                            .usedAmount(log.getUsedAmount())
                            .txHash(log.getTxHash())
                            .usedAt(log.getUsedAt())
                            .build();
                })
                .collect(Collectors.toList());

        log.info("사용 내역 조회: walletAddress={}, count={}", walletAddress, responseList.size());
        return CommonResponse.success(responseList);
    }

    /**
     * 바우처 검증 (가맹점용)
     * isValid: status==1 이고 만료일이 지나지 않은 경우
     */
    @Transactional(readOnly = true, transactionManager = "voucherTransactionManager")
    public CommonResponse<?> verifyVoucher(Long tokenId) {
        Optional<Voucher> voucherOpt = voucherRepository.findByTokenId(tokenId);

        if (voucherOpt.isEmpty()) {
            VoucherDto.VerifyResponse response = VoucherDto.VerifyResponse.builder()
                    .isValid(false)
                    .build();
            return CommonResponse.success(response);
        }

        Voucher voucher = voucherOpt.get();
        Program program = programRepository.findById(voucher.getProgramId()).orElse(null);

        boolean isValid = voucher.getStatus() == 1
                && program != null
                && !program.getExpiryDate().isBefore(java.time.LocalDate.now());

        // 보유자 닉네임 조회
        String ownerName = voucher.getWalletAddress();

        VoucherDto.VerifyResponse response = VoucherDto.VerifyResponse.builder()
                .isValid(isValid)
                .ownerName(ownerName)
                .amount(program != null ? program.getAmount() : null)
                .expiryDate(program != null ? program.getExpiryDate() : null)
                .build();

        log.info("바우처 검증: tokenId={}, isValid={}", tokenId, isValid);
        return CommonResponse.success(response);
    }
}
