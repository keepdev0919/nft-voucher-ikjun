package com.ssafy.ttocket.voucher.service;

import com.ssafy.ttocket.voucher.dto.CommonResponse;
import com.ssafy.ttocket.voucher.dto.ProgramDto;
import com.ssafy.ttocket.voucher.entity.Program;
import com.ssafy.ttocket.voucher.repository.ProgramRepository;
import com.ssafy.ttocket.voucher.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service("voucherProgramService")
@RequiredArgsConstructor
public class ProgramService {

    private final ProgramRepository programRepository;
    private final VoucherRepository voucherRepository;

    /**
     * 신청 가능한 프로그램 목록 조회
     * remainCount = totalSupply - 발급된(status=1) 바우처 수
     */
    @Transactional(readOnly = true, transactionManager = "voucherTransactionManager")
    public CommonResponse<?> getProgramList() {
        List<Program> programs = programRepository.findAllByOrderByProgramIdDesc();

        List<ProgramDto.ListResponse> responseList = programs.stream()
                .map(program -> {
                    // status=1(활성) 바우처 수를 신청된 수로 계산
                    long issuedCount = voucherRepository.countByProgramIdAndStatus(program.getProgramId(), 1);
                    long remainCount = program.getTotalSupply() - issuedCount;

                    return ProgramDto.ListResponse.builder()
                            .programId(program.getProgramId())
                            .name(program.getName())
                            .amount(program.getAmount())
                            .expiryDate(program.getExpiryDate())
                            .totalSupply(program.getTotalSupply())
                            .category(program.getCategory())
                            .issuerWallet(program.getIssuerWallet())
                            .remainCount(Math.max(remainCount, 0))
                            .build();
                })
                .collect(Collectors.toList());

        log.info("프로그램 목록 조회 완료: {}건", responseList.size());
        return CommonResponse.success(responseList);
    }

    /**
     * 프로그램 생성
     */
    @Transactional(transactionManager = "voucherTransactionManager")
    public CommonResponse<?> createProgram(ProgramDto.CreateRequest request) {
        Program program = Program.builder()
                .name(request.getName())
                .amount(request.getAmount())
                .expiryDate(request.getExpiryDate())
                .totalSupply(request.getTotalSupply())
                .category(request.getCategory())
                .issuerWallet(request.getIssuerWallet())
                .build();

        Program saved = programRepository.save(program);

        log.info("프로그램 생성 완료: programId={}, name={}", saved.getProgramId(), saved.getName());
        return CommonResponse.created(saved);
    }
}
