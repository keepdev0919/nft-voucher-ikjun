package com.ssafy.ttocket.repository.querydsl;

import com.ssafy.ttocket.domain.PerformanceLike;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PerformanceLikeRepositoryCustom {

    List<PerformanceLike> findFirstListByUserId(String userId);
    Page<PerformanceLike> findByCustom_cursorPaging(Pageable pageable, int cursorId, String userId);  // querydsl 방식
}
