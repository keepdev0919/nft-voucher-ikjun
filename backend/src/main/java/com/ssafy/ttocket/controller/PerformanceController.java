package com.ssafy.ttocket.controller;

import com.ssafy.ttocket.dto.EnterInputDto;
import com.ssafy.ttocket.dto.PerformanceDto;
import com.ssafy.ttocket.dto.ResponseDto;
import com.ssafy.ttocket.service.PerformanceListService;
import com.ssafy.ttocket.service.PerformanceService;
import io.swagger.annotations.ApiParam;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@Tag(name = "공연", description = "공연 관련 API")
@RestController
@RequestMapping("/performance")
@RequiredArgsConstructor
@Log4j2
@ControllerAdvice
public class PerformanceController {
    private final PerformanceService performanceService;
    private final PerformanceListService performanceListService;

    @Operation(summary = "홈 화면", description = "로그인 한 유저의 홈 화면")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation", content = @Content(schema = @Schema(implementation = ResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "bad request operation", content = @Content(schema = @Schema(implementation = ResponseDto.class)))
    })
    @GetMapping("/home/{userId}")
    public ResponseEntity<ResponseDto> home(@ApiParam(value = "유저 ID") @PathVariable String userId){
        log.debug("유저 공연 전 티켓 목록 요청 GET: /home/{userId}, userId:{}", userId);
        ResponseDto responseDto = performanceListService.homeList(userId);
        return new ResponseEntity<ResponseDto>(responseDto, HttpStatus.OK);
    }

    @Operation(summary = "공연 생성", description = "공연 생성하기")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation", content = @Content(schema = @Schema(implementation = ResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "bad request operation", content = @Content(schema = @Schema(implementation = ResponseDto.class)))
    })
    @PostMapping("/create")
    public ResponseEntity<ResponseDto> performanceCreate(@ApiParam(value = "공연 DTO") @RequestBody @Valid PerformanceDto performanceDto) {
        log.debug("공연 생성 요청 POST: /create");
        ResponseDto responseDto = performanceListService.createPerformance(performanceDto);
        return new ResponseEntity<ResponseDto>(responseDto, HttpStatus.OK);
    }

    @Operation(summary = "공연 리스트 조회", description = "공연 목록: 커서 (페이징 적용)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation", content = @Content(schema = @Schema(implementation = ResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "bad request operation", content = @Content(schema = @Schema(implementation = ResponseDto.class)))
    })
    @GetMapping(value = {"/list/{cursorId}", "/list"})  // 전체 공연 목록
    public ResponseEntity<ResponseDto> performanceList(@ApiParam(value = "커서 ID") @PathVariable(required = false) Integer cursorId) {
        log.debug("전체 공연 목록 요청 GET: /list/cursorId, cursorId:{}", cursorId);
        if (cursorId == null) {
            cursorId = 0;
        }
        ResponseDto responseDto = performanceListService.performanceList(cursorId, 6);  // size 설정
        return new ResponseEntity<ResponseDto>(responseDto, HttpStatus.OK);
    }

    @Operation(summary = "사용자 좋아요 리스트 조회", description = "사용자: 유저 아이디")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation", content = @Content(schema = @Schema(implementation = ResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "bad request operation", content = @Content(schema = @Schema(implementation = ResponseDto.class)))
    })
    @GetMapping(value = {"/likelist/{userId}/{cursorId}", "/likelist/{userId}"})
    public ResponseEntity<ResponseDto> userlikeList(@ApiParam(value = "유저 ID") @PathVariable String userId,
                                                    @ApiParam(value = "커서 ID") @PathVariable(required = false) Integer cursorId) {
        log.debug("찜 공연 목록 요청 GET: /likelist/{userId}/{curosrId}, userId: {}, cursorId: {}", userId, cursorId);
        if (cursorId == null) {
            cursorId  = 0;
        }
        ResponseDto responseDto = performanceListService.userlikeList(userId, cursorId, 6);
        return new ResponseEntity<ResponseDto>(responseDto, HttpStatus.OK);
    }

    @Operation(summary = "공연 상세보기", description = "공연 조회: 사용자 ID(좋아요), 공연 ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation", content = @Content(schema = @Schema(implementation = ResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "bad request operation", content = @Content(schema = @Schema(implementation = ResponseDto.class)))
    })
    @GetMapping("/{userId}/{performanceId}")  // 공연 설명 상세보기
    public ResponseEntity<ResponseDto> performanceDetail(@ApiParam(value = "유저 ID") @PathVariable String userId,
                                                         @ApiParam(value = "공연 ID") @PathVariable Integer performanceId) {
        log.debug("공연 상세보기 요청 GET: /{userId}/{performanceId}, userId:{}, performanceId:{}", userId, performanceId);
        ResponseDto responseDto = performanceService.performanceDetail(userId, performanceId);
        return new ResponseEntity<ResponseDto>(responseDto, HttpStatus.OK);
    }

    @Operation(summary = "공연 좋아요 클릭", description = "좋아요: 사용자 ID, 공연 ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation", content = @Content(schema = @Schema(implementation = ResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "bad request operation", content = @Content(schema = @Schema(implementation = ResponseDto.class)))
    })
    @PutMapping("/like/{userId}/{performanceId}")  // 좋아요 클릭
    public ResponseEntity<ResponseDto> clickLike(@ApiParam(value = "유저 ID") @PathVariable String userId,
                                                 @ApiParam(value = "공연 ID") @PathVariable int performanceId) {
        log.debug("공연 좋아요 클릭 요청 PUT: /like/{userId}/{performanceId}, userId:{}, performanceId:{}", userId, performanceId);
        ResponseDto responseDto = performanceService.clickLike(userId, performanceId);
        return new ResponseEntity<ResponseDto>(responseDto, HttpStatus.OK);
    }

    @Operation(summary = "예매하기", description = "공연 ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation", content = @Content(schema = @Schema(implementation = ResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "bad request operation", content = @Content(schema = @Schema(implementation = ResponseDto.class)))
    })
    @GetMapping("/reserve/{performanceId}")  // 공연 상세보기에서 예매하기 버튼 클릭
    public ResponseEntity<ResponseDto> performanceReservation(@ApiParam(value = "공연 ID") @PathVariable int performanceId) {
        log.debug("공연 좌석 별 상태 요청 GET: /reserve/{performanceId}, performanceId:{}", performanceId);
        ResponseDto responseDto = performanceService.reservationState(performanceId);
        return new ResponseEntity<ResponseDto>(responseDto, HttpStatus.OK);
    }

    @Operation(summary = "좌석 예약", description = "공연ID, 좌석ID, 상태코드")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "successful operation", content = @Content(schema = @Schema(implementation = ResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "bad request operation", content = @Content(schema = @Schema(implementation = ResponseDto.class)))
    })
    @PutMapping("/{performanceId}/{seatId}/{code}")  // 좌석 상태 변경
    public ResponseEntity<ResponseDto> performanceReservation(@ApiParam(value = "공연 ID") @PathVariable int performanceId,
                                                              @ApiParam(value = "좌석 번호") @PathVariable int seatId,
                                                              @ApiParam(value = "전송 상태 코드") @PathVariable int code)
                                                                throws RedisConnectionFailureException {
        log.debug("좌석 선택 요청 PUT: /{performance}/{seatId}/{code}, performance: {}, seatId:{}, code:{}", performanceId, seatId, code);
        ResponseDto responseDto = performanceService.changeReservationState(performanceId, seatId, code);
        return new ResponseEntity<ResponseDto>(responseDto, HttpStatus.OK);
    }

    @PostMapping("/enter")
    public ResponseEntity<ResponseDto> CreateEnterLog(@RequestBody @Valid EnterInputDto enterInputDto){
        log.debug("공연 입장 체크 / 등록 POST: /{performance}/{seatId}/{code}, performanceId: {}, seatNum:{}, nickname:{}", enterInputDto.getPerformId(), enterInputDto.getSeatNum(), enterInputDto.getNickname());
        ResponseDto responseDto = performanceService.createEnterLog(enterInputDto);
        return new ResponseEntity<ResponseDto>(responseDto, HttpStatus.OK);
    }

    @GetMapping("/log/{performanceId}")
    public ResponseEntity<ResponseDto> EnterLogList(@PathVariable int performanceId){
        log.debug("공연 입장 로그 목록 GET: /log/{performance}, performanceId: {}", performanceId);
        ResponseDto responseDto = performanceService.EnterLogList(performanceId);
        return new ResponseEntity<ResponseDto>(responseDto, HttpStatus.OK);
    }
}
