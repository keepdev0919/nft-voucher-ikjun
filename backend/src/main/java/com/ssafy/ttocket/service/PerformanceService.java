package com.ssafy.ttocket.service;

import com.ssafy.ttocket.domain.*;
import com.ssafy.ttocket.dto.EnterInputDto;
import com.ssafy.ttocket.dto.EnterOutputDto;
import com.ssafy.ttocket.dto.PerformanceDto;
import com.ssafy.ttocket.dto.ResponseDto;
import com.ssafy.ttocket.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class PerformanceService {

    private final PerformanceRepository performanceRepository;
    private final SeatRepository seatRepository;
    private final PerformanceLikeRepository performanceLikeRepository;
    private final UserRepository userRepository;
    private final EnterLogRepository enterLogRepository;
    private final TimeService timeService;
    private final RedisTemplate redisTemplate;
    static final int seatRowNums = 8;
    static final int GapQRTime = 15;
    public ArrayList<String> canceledSeatList = new ArrayList<>();

    public ResponseDto performanceDetail(String userId, int performanceId) {
        Map<String,Object> result = new HashMap<>();
        ResponseDto responseDto = new ResponseDto();
        boolean isLike;

        Performance performance = performanceRepository.findById(performanceId);
        PerformanceLike performanceLike = performanceLikeRepository.findByUserIdAndPerformanceId(userId, performanceId);

        // 공연 좋아요 여부
        if (performanceLike == null || performanceLike.isLike() == false) {
            isLike = false;
        } else {
            isLike = true;
        }

        PerformanceDto performanceDto = PerformanceDto.builder()
                .id(performance.getId())
                .title(performance.getTitle())
                .startTime(timeService.LocalDateTimeToString(performance.getStartTime()))
                .endTime(timeService.LocalDateTimeToString(performance.getEndTime()))
                .location(performance.getLocation())
                .price(performance.getPrice())
                .maxSeats(performance.getMax_seats())
                .desc(performance.getDescription())
                .etc(performance.getEtc())
                .poster(performance.getPoster())
                .userId(performance.getUser().getId())
                .build();

        // 현재와 공연 시간과의 차이
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = LocalDateTime.parse(performanceDto.getStartTime());
        LocalDateTime endTime = LocalDateTime.parse(performanceDto.getEndTime());

        Duration beforeDuration = Duration.between(startTime, now);
        Duration afterDuration = Duration.between(now, endTime);

        // 예약 가능한 기간에 따라 true/false 표기
        boolean canReserve;
        if (beforeDuration.compareTo(Duration.ZERO) > 0 && afterDuration.compareTo(Duration.ZERO) > 0) {
            canReserve = true;
        } else {
            canReserve = false;
        }

        // 찾은 데이터 result에 입력
        result.put("canReserve", canReserve);
        result.put("performance_dto", performanceDto);
        result.put("is_user_like", isLike);

        responseDto.setMessage("티켓팅 상세보기 데이터 리턴");
        responseDto.setBody(result);
        responseDto.setStatusCode(200);
        return responseDto;
    }

    public ResponseDto clickLike(String userId, int performanceId) {

        boolean result;
        ResponseDto responseDto = new ResponseDto();

        // 필요 데이터 조회
        Optional<PerformanceLike> checkPerformanceLike = performanceLikeRepository.findByPerformanceIdAndUserId(performanceId, userId);
        Performance performance = performanceRepository.findById(performanceId);
        Optional<User> user = userRepository.findById(userId);

        if (user.isPresent()) {
            // 좋아요 클릭시 상태 변경
            if (checkPerformanceLike.isPresent()) {
                PerformanceLike performanceLike = checkPerformanceLike.get();
                boolean isLiked = performanceLike.isLike();
                performanceLike.setLike(!isLiked);
                performanceLikeRepository.save(performanceLike);
            }
            else {
                PerformanceLike performanceLike = new PerformanceLike();
                performanceLike.setUser(new User(user.get().getId(), user.get().getNickname()));
                performanceLike.setPerformance(performance);
                performanceLike.setLikeId(new LikeId(performanceId, userId));
                performanceLike.setLike(true);
                performanceLikeRepository.save(performanceLike);
            }

            result = performanceLikeRepository.findByPerformanceIdAndUserId(performanceId, userId).get().isLike();
            responseDto.setMessage("공연 좋아요 데이터 리턴");
            responseDto.setBody(result);
            responseDto.setStatusCode(200);
            return responseDto;
        } else {
            log.debug("user 정보가 존재하지 않습니다");
        }
        return responseDto;
    }

    public ResponseDto reservationState(int performanceId) {
        Map<String,Object> result = new HashMap<>();
        ResponseDto responseDto = new ResponseDto();
        String key = "seatStatus::" + performanceId;
        ListOperations listOperations = redisTemplate.opsForList();

        // Redis에 좌석정보가 기록된 적이 없을 때, Redis에 좌석정보 기록
        if(listOperations.size(key) == 0){
            List<Seat> seats = seatRepository.findByPerformanceId(performanceId);
            seats.forEach(seat -> listOperations.rightPush(key, String.valueOf(seat.getStatus())));
        }

        List range = listOperations.range(key, 0, -1);
        int idx = 0;
        Long listSize = listOperations.size(key)/8;
        ArrayList<ArrayList> arrayList1 = new ArrayList<>();

        // key = seatStatus::N에 행렬로 좌석정보 저장
        for (int i = 0; i < listSize+1; i++) {
            if (i == listSize) {
                if (listOperations.size(key) % seatRowNums != 0) {
                    ArrayList<String> arrayList2 = new ArrayList<>();
                    for (int j = 0; j < listOperations.size(key) % seatRowNums; j++) {
                        arrayList2.add((String) range.get(idx++));
                    }
                    arrayList1.add(arrayList2);
                }
            } else {
                ArrayList<String> arrayList2 = new ArrayList<>();
                for (int j = 0; j < seatRowNums; j++) {
                    arrayList2.add((String) range.get(idx++));
                }
                arrayList1.add(arrayList2);
            }
        }

        // 공연 정보
        Performance perform = performanceRepository.findById(performanceId);
        log.debug("reservationState - performance : {}", perform.toString());

        result.put("seats_state", arrayList1);
        result.put("perform", perform);

        responseDto.setMessage("공연 좌석보기 데이터 리턴");
        responseDto.setBody(result);
        responseDto.setStatusCode(200);
        return responseDto;
    }

    public ResponseDto changeReservationState(int performanceId, int seatId, int code) {
        Map<String,Object> result = new HashMap<>();
        ResponseDto responseDto = new ResponseDto();

        String key = "seatStatus::" + performanceId;
        ListOperations listOperations = redisTemplate.opsForList();
        if(listOperations.size(key) == 0){
            List<Seat> seats = seatRepository.findByPerformanceId(performanceId);
            for(int i=0; i<seats.size(); i++){
                listOperations.rightPush(key,String.valueOf(seats.get(i).getStatus()));
            }
        }
        // code 2: 예약완료, 좌석상태를 RESERVED로 변경
        if(code == 2){
            listOperations.set(key,(long)seatId - 1,String.valueOf(SeatStatus.RESERVED));
            log.debug(performanceId+"번 공연 "+ seatId+ "번 좌석 RESERVED으로 변경 완료");
            result.put("isSuccess", true);
            responseDto.setMessage(performanceId+"번 공연 "+ seatId+ "번 좌석 RESERVED으로 변경 완료");
            responseDto.setBody(redisTemplate.opsForList().index(key, (long)seatId-1));
            responseDto.setStatusCode(200);
            return responseDto;
        }
        // code 3: 구매중, 사용자가 좌석 선택을 선택하면 PURCHASING으로 변경, {비어있음, 예매후 취소, 예매 중 취소}일 때만 작동
        else if(code == 3){
            String status = (String) listOperations.index(key, (long)seatId - 1);
            // 1. 비어있음
            if (status.isEmpty()) {
                log.debug("status 값이 null");
            }
            else {
                if(status.equals(String.valueOf(SeatStatus.EMPTY))){
                    listOperations.set(key,(long)seatId - 1,String.valueOf(SeatStatus.PURCHASING));
                    log.debug(performanceId+"번 공연 "+ seatId+ "번 좌석 PURCHASING으로 변경 완료");
                    result.put("isSuccess", true);
                    result.put("beforeStatus","EMPTY");  // EMPTY & PURCHASING_CANCEL
                    responseDto.setMessage(performanceId+"번 공연 "+ seatId+ "번 좌석 PURCHASING으로 변경 완료");
                    responseDto.setBody(redisTemplate.opsForList().index(key, seatId-1));
                    responseDto.setStatusCode(200);
                }
                // 2. 예매 후 취소
                else if(status.equals(String.valueOf(SeatStatus.PURCHASED_CANCEL))){
                    listOperations.set(key,(long)seatId - 1,String.valueOf(SeatStatus.PURCHASING));
                    log.debug(performanceId+"번 공연 "+ seatId+ " 취소티켓 구매시도");
                    result.put("isSuccess", true);
                    result.put("beforeStatus","PURCHASED_CANCEL");
                    responseDto.setMessage(performanceId+"번 공연 "+ seatId+ " 취소티켓 구매시도");
                    responseDto.setBody(redisTemplate.opsForList().index(key, (long)seatId-1));
                    responseDto.setStatusCode(200);
                }
                // 3. 예매 중 취소
                else{
                    log.debug(performanceId+"번 공연 "+ seatId+ "번 좌석 이미 선택됨");
                    result.put("isSuccess", false);
                    responseDto.setMessage("이미 선택된 좌석입니다.");
                    responseDto.setBody(redisTemplate.opsForList().index(key, (long)seatId-1));
                    responseDto.setStatusCode(400);
                }
                return responseDto;
            }
        }
        // code 5: 좌석상태 CANCEL로 변경
        else if(code == 5){
            canceledSeatList.add(Arrays.toString(new int[]{performanceId, seatId}));
            listOperations.set(key,(long)seatId - 1,String.valueOf(SeatStatus.PURCHASED_CANCEL));
            result.put("isSuccess", true);
            responseDto.setMessage(performanceId+"번 공연 "+ seatId+ "번 좌석 CANCEL으로 변경 완료");
            responseDto.setBody(redisTemplate.opsForList().index(key, (long)seatId-1));
            responseDto.setStatusCode(200);

            // canceledSeatsList에 기록
            listOperations.rightPush("canceledSeatsList", performanceId+":"+seatId);
            log.debug("구매완료 후 취소, canceledSeatslist에 취소된 '공연::좌석' 등록");

            return responseDto;
        }
        // code 7 : 좌석상태 EMPTY로 변경
        else if (code == 7) {
            listOperations.set(key,(long)seatId - 1,String.valueOf(SeatStatus.EMPTY));
            log.debug(performanceId+"번 공연 "+ seatId+ "번 좌석 EMPTY으로 변경 완료");

            result.put("isSuccess", true);
            responseDto.setMessage(performanceId+"번 공연 "+ seatId+ "번 좌석 EMPTY으로 변경 완료");
            responseDto.setBody(redisTemplate.opsForList().index(key, (long)seatId-1));
            responseDto.setStatusCode(200);

            return responseDto;
        }

        // 설정된 code에 해당하지 않은 경우
        responseDto.setMessage("code 확인해주세요");
        responseDto.setBody(result);
        responseDto.setStatusCode(400);
        return responseDto;
    }

    public ResponseDto userCreatedList(String userId) {
        Map<String,Object> result = new HashMap<>();
        ResponseDto responseDto = new ResponseDto();
        List<Performance> userCreatedList = performanceRepository.findByCreatedUserId(userId);

        result.put("user_created_list", userCreatedList);
        responseDto.setBody(result);
        responseDto.setMessage("유저가 생성한 공연 목록");
        responseDto.setStatusCode(200);
        return responseDto;
    }

    @Transactional
    public ResponseDto createEnterLog(EnterInputDto enterInputDto) {
        Map<String, Object> result = new HashMap<>();
        ResponseDto responseDto = new ResponseDto();
        String timeQR1 = enterInputDto.getTimeQR();
        LocalDateTime timeQR = LocalDateTime.of(Integer.parseInt(timeQR1.substring(0, 4)),
                Integer.parseInt(timeQR1.substring(5, 7)),
                Integer.parseInt(timeQR1.substring(8, 10)),
                Integer.parseInt(timeQR1.substring(11, 13)),
                Integer.parseInt(timeQR1.substring(14, 16)),
                Integer.parseInt(timeQR1.substring(17)));

        Duration duration = Duration.between(timeQR, LocalDateTime.now());
        if (duration.toSeconds() > GapQRTime) {
            result.put("isSuccess", false);
            responseDto.setBody(result);
            responseDto.setMessage("만료된 QR코드입니다. 다시 생성해주세요.");
            responseDto.setStatusCode(402);
            return responseDto;
        }

        int performanceId = Integer.parseInt(enterInputDto.getPerformId());
        int seatNum = Integer.parseInt(enterInputDto.getSeatNum());
        String key = "seatStatus::" + performanceId;
        ListOperations listOperations = redisTemplate.opsForList();
        Performance perform = performanceRepository.findById(performanceId);

        if (listOperations.size(key) == 0) {
            List<Seat> seats = seatRepository.findByPerformanceId(performanceId);
            for (int i = 0; i < seats.size(); i++) {
                listOperations.rightPush(key, String.valueOf(seats.get(i).getStatus()));
            }
        }

        String status = (String) listOperations.index(key, (long) seatNum - 1);
        if (status.isEmpty()) {
            log.debug("status is empty");
        } else {
            if (status.equals(String.valueOf(SeatStatus.RESERVED))) {
                listOperations.set(key, (long) seatNum - 1, String.valueOf(SeatStatus.PERFORM_ENTER));
                log.debug(performanceId + "번 공연 " + seatNum + "번 좌석 PERFORM_ENTER으로 변경 완료");
                LocalDateTime nt = LocalDateTime.now();
                EnterLog enterLog = EnterLog.builder()
                        .enterTime(nt)
                        .seatNum(seatNum)
                        .nickname(enterInputDto.getNickname())
                        .performance(perform)
                        .build();
                enterLogRepository.save(enterLog);
                EnterOutputDto enterOutputDto = EnterOutputDto.builder()
                        .seatNum(seatNum)
                        .nickname(enterInputDto.getNickname())
                        .enterTime(nt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                        .build();
                result.put("isSuccess", true);
                result.put("enter_log", enterOutputDto);
                responseDto.setBody(result);
                responseDto.setMessage(performanceId + "번 공연 " + seatNum + "번 좌석 PERFORM_ENTER으로 변경 완료");
                responseDto.setStatusCode(200);
                return responseDto;

            } else if (status.equals(String.valueOf(SeatStatus.PERFORM_ENTER))) {
                log.debug("***이미 입장한 티켓 입장 요청***");
                result.put("isSuccess", false);
                responseDto.setBody(result);
                responseDto.setMessage("이미 입장 처리된 티켓입니다.");
                responseDto.setStatusCode(401);
                return responseDto;

            } else {
                log.debug("***RESERVED 아닌 티켓 입장 요청***");
                result.put("isSuccess", false);
                responseDto.setBody(result);
                responseDto.setMessage("구매 완료된 티켓이 아닙니다.");
                responseDto.setStatusCode(400);
                return responseDto;
            }
        }
        return responseDto;
    }
    public ResponseDto EnterLogList(int performanceId) {
        Map<String,Object> result = new HashMap<>();
        ResponseDto responseDto = new ResponseDto();
        List<EnterLog> logList = enterLogRepository.findByPerformanceId(performanceId);
        Performance perform = performanceRepository.findById(performanceId);
        ArrayList<EnterOutputDto> output = new ArrayList<>();
        logList.forEach(enterLog -> output.add(EnterOutputDto.builder()
                            .enterTime(enterLog.getEnterTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                            .nickname(enterLog.getNickname())
                            .seatNum(enterLog.getSeatNum())
                            .build()));
        result.put("enter_log_list", output);
        result.put("max_seat",perform.getMax_seats());
        result.put("enter_cnt",output.size());
        responseDto.setBody(result);
        responseDto.setMessage("공연 입장 로그 목록 리턴");
        responseDto.setStatusCode(200);
        return responseDto;
    }
}
