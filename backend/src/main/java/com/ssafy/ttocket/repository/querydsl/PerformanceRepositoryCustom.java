package com.ssafy.ttocket.repository.querydsl;

import com.ssafy.ttocket.domain.Performance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PerformanceRepositoryCustom {
    List<Performance> findOpenSoon();
    List<Performance> findPerformSoon();
    Page<Performance> findByCustom_cursorPaging(Pageable pageable, int cursorId);
    List<Performance> findByCreatedUserId(String userId);
}
