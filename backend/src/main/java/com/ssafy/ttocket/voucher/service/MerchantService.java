package com.ssafy.ttocket.voucher.service;

import com.ssafy.ttocket.voucher.dto.CommonResponse;
import com.ssafy.ttocket.voucher.dto.MerchantUseDto;
import com.ssafy.ttocket.voucher.entity.Merchant;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service("voucherMerchantService")
@RequiredArgsConstructor
public class MerchantService {

    private final MerchantRepository merchantRepository;
    private final MerchantLogRepository merchantLogRepository;
    private final VoucherRepository voucherRepository;
    private final ProgramRepository programRepository;

    /**
     * 가맹점 목록 조회
     */
    @Transactional(readOnly = true, transactionManager = "voucherTransactionManager")
    public CommonResponse<?> getMerchantList() {
        List<Merchant> merchants = merchantRepository.findAllByOrderByNameAsc();

        List<MerchantUseDto.MerchantResponse> responseList = merchants.stream()
                .map(m -> MerchantUseDto.MerchantResponse.builder()
                        .walletAddress(m.getWalletAddress())
                        .name(m.getName())
                        .category(m.getCategory())
                        .build())
                .collect(Collectors.toList());

        log.info("가맹점 목록 조회: {}건", responseList.size());
        return CommonResponse.success(responseList);
    }

    /**
     * 가맹점 등록
     */
    @Transactional(transactionManager = "voucherTransactionManager")
    public CommonResponse<?> registerMerchant(MerchantUseDto.RegisterRequest request) {
        Merchant merchant = Merchant.builder()
                .walletAddress(request.getWalletAddress())
                .name(request.getName())
                .category(request.getCategory())
                .build();

        merchantRepository.save(merchant);

        MerchantUseDto.MerchantResponse response = MerchantUseDto.MerchantResponse.builder()
                .walletAddress(merchant.getWalletAddress())
                .name(merchant.getName())
                .category(merchant.getCategory())
                .build();

        log.info("가맹점 등록 완료: walletAddress={}, name={}", merchant.getWalletAddress(), merchant.getName());
        return CommonResponse.created(response);
    }

    /**
     * 바우처 사용 처리
     * - txHash를 idempotency key로 사용: 이미 존재하면 200 반환 (중복 처리 방지)
     * - 없으면 MerchantLog 저장 + Voucher status 업데이트
     *   - 누적 사용금액 >= 프로그램 총액 → status=2(소진)
     *   - 부분 사용 → status=1 유지
     */
    @Transactional(transactionManager = "voucherTransactionManager")
    public CommonResponse<?> useVoucher(MerchantUseDto.UseRequest request, String headerTxHash) {
        // txHash 결정: body 우선, 없으면 헤더 사용
        String txHash = (request.getTxHash() != null && !request.getTxHash().isBlank())
                ? request.getTxHash()
                : headerTxHash;

        if (txHash == null || txHash.isBlank()) {
            return CommonResponse.error(400, "txHash가 필요합니다. body 또는 X-Tx-Hash 헤더로 전달해주세요.");
        }

        // idempotency 체크: 이미 처리된 txHash인지 확인
        Optional<MerchantLog> existingLog = merchantLogRepository.findByTxHash(txHash);
        if (existingLog.isPresent()) {
            log.info("중복 요청(idempotent 처리): txHash={}", txHash);
            return CommonResponse.success(existingLog.get());
        }

        // 바우처 존재 여부 확인
        Optional<Voucher> voucherOpt = voucherRepository.findByTokenId(request.getTokenId());
        if (voucherOpt.isEmpty()) {
            return CommonResponse.error(404, "존재하지 않는 바우처입니다.");
        }

        Voucher voucher = voucherOpt.get();

        // 가맹점 존재 여부 확인
        if (merchantRepository.findByWalletAddress(request.getMerchantWallet()).isEmpty()) {
            return CommonResponse.error(400, "등록되지 않은 가맹점입니다.");
        }

        // 사용 로그 저장
        MerchantLog merchantLog = MerchantLog.builder()
                .tokenId(request.getTokenId())
                .merchantWallet(request.getMerchantWallet())
                .usedAmount(request.getUsedAmount())
                .txHash(txHash)
                .build();

        merchantLogRepository.save(merchantLog);

        // 바우처 status 업데이트
        Optional<Program> programOpt = programRepository.findById(voucher.getProgramId());
        if (programOpt.isPresent()) {
            Program program = programOpt.get();

            // 해당 바우처의 누적 사용금액 합산 (방금 저장한 건 포함)
            List<MerchantLog> allLogs = merchantLogRepository.findByTokenIdOrderByUsedAtDesc(request.getTokenId());
            BigDecimal totalUsed = allLogs.stream()
                    .map(MerchantLog::getUsedAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (totalUsed.compareTo(program.getAmount()) >= 0) {
                // 전액 사용 완료 → 소진(status=2)
                voucher.setStatus(2);
                voucherRepository.save(voucher);
                log.info("바우처 소진 처리: tokenId={}, totalUsed={}", request.getTokenId(), totalUsed);
            }
            // 부분 사용은 status=1 유지 — 별도 저장 불필요
        }

        log.info("바우처 사용 처리 완료: tokenId={}, merchantWallet={}, usedAmount={}, txHash={}",
                request.getTokenId(), request.getMerchantWallet(), request.getUsedAmount(), txHash);

        return CommonResponse.success(merchantLog);
    }
}
