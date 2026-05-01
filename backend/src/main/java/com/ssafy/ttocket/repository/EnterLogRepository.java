package com.ssafy.ttocket.repository;

import com.ssafy.ttocket.domain.EnterLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnterLogRepository extends JpaRepository<EnterLog, Integer> {
    List<EnterLog> findByPerformanceId(int performanceId);
}
