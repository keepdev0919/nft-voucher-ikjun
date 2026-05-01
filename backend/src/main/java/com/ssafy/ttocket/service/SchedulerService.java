package com.ssafy.ttocket.service;

import com.ssafy.ttocket.domain.Seat;
import com.ssafy.ttocket.domain.SeatStatus;
import com.ssafy.ttocket.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.DataType;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
@Service
@Slf4j
@RequiredArgsConstructor
public class SchedulerService {

    private final RedisTemplate redisTemplate;
    private final SeatRepository seatRepository;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void changeSeatsStatus() {
        log.debug("CanceledSeat 반영 : 1분");
        ListOperations listOperations = redisTemplate.opsForList();

        //==취소 표를 레디스 canceledList에 등록, 스케줄러 실행 시에 MySQL 정보 업데이트==//
        String canceledList = "canceledSeatsList";
        Long size = listOperations.size(canceledList);
        for (int i = 0; i < size; i++) {
            List<String> canceledSeats = redisTemplate.opsForList().range(canceledList, 0, -1);
            for (String canceledSeat : canceledSeats) {
                int performanceId = Integer.parseInt(canceledSeat.substring(0, 1));
                int seat_no = Integer.parseInt(canceledSeat.substring(canceledSeat.indexOf(":") + ":".length()));

                String key = "seatStatus::" + performanceId;
                listOperations.set(key, (long)seat_no-1, SeatStatus.PURCHASED_CANCEL.toString());
            }
        }
        redisTemplate.delete(canceledList);
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void backUpToRDB() {
        log.debug("Cache -> RDB BackUp : 60분");
        ListOperations listOperations = redisTemplate.opsForList();
        // 클래스 나눠서 시간대를 길게 매서드
        // 람다식 적용 방법 찾아서 적용하기
        Set<String> keys = redisTemplate.keys("seatStatus::*");
        keys.forEach(key -> {
            String keyIdx = key.substring(12);  // performanceId 추출
            if (!redisTemplate.type(key).equals(DataType.NONE)) {
                List<Seat> targetSeats = seatRepository.findByPerformanceId(Integer.parseInt(keyIdx));  // 좌석 정보를 가져오기 위해 repository 탐색
                List<String> list = listOperations.range("seatStatus::" + keyIdx, 0, -1);  // 레디스

                // 아래 조건에 걸리지 않는 경우 탐색 필요 -> 개발과정에서 mysql 개별 조작 가능성
                if (list.size() == targetSeats.size()) {
                    for (int i = 0; i < list.size(); i++) {
                        SeatStatus s = SeatStatus.valueOf(list.get(i));
                        targetSeats.get(i).setStatus(s);
                        seatRepository.save(targetSeats.get(i));
                    }
                }
            } else {
                log.debug("리스트 타입이 아님");
            }
        });
    }
    
}
