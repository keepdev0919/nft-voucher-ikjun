package com.ssafy.ttocket.repository;

import com.ssafy.ttocket.domain.Seat;
import com.ssafy.ttocket.domain.SeatId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, SeatId> {
    List<Seat> findByPerformanceId(int performanceId);
}
