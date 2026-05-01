package com.ssafy.ttocket.repository;

import com.ssafy.ttocket.domain.PerformanceLike;
import com.ssafy.ttocket.repository.querydsl.PerformanceLikeRepositoryCustom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PerformanceLikeRepository extends JpaRepository<PerformanceLike, Integer>, PerformanceLikeRepositoryCustom {

    List<PerformanceLike> findFirstListByUserId(String userId);
    List<PerformanceLike> findByUserId(String userId);
    Optional<PerformanceLike> findByPerformanceIdAndUserId(int performanceId, String userId);
    PerformanceLike findByUserIdAndPerformanceId(String userId, int performanceId);
    Page<PerformanceLike> findByCustom_cursorPaging(Pageable pageable, int cursorId, String userId);
}
