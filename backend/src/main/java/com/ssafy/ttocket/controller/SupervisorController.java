package com.ssafy.ttocket.controller;

import com.ssafy.ttocket.dto.ResponseDto;
import com.ssafy.ttocket.service.PerformanceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "주관사", description = "주관사 관련 API")
@RestController
@RequestMapping("/supervisor")
@RequiredArgsConstructor
@Log4j2
@ControllerAdvice
public class SupervisorController {

    private final PerformanceService performanceService;

    @GetMapping("/list/{userId}")
    public ResponseEntity<ResponseDto> list(@PathVariable String userId) {
        log.debug("내가 만든 공연 목록 요청 GET: /supervisor/list/{userId}m userId:{}", userId);
        ResponseDto responseDto = performanceService.userCreatedList(userId);
        return new ResponseEntity<ResponseDto>(responseDto, HttpStatus.OK);
    }
}
