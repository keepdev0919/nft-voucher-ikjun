package com.ssafy.ttocket.repository.querydsl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.ttocket.domain.Performance;
import com.ssafy.ttocket.domain.QPerformance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.support.QuerydslRepositorySupport;

import javax.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.List;

import static com.ssafy.ttocket.domain.QPerformance.performance;

public class PerformanceRepositoryImpl extends QuerydslRepositorySupport implements PerformanceRepositoryCustom{

    private final JPAQueryFactory queryFactory;

    public PerformanceRepositoryImpl(EntityManager em) {
        super(Performance.class);
        this.queryFactory = new JPAQueryFactory(em);
    }
    QPerformance qPerformance = performance;

    @Override
    public List<Performance> findOpenSoon() {
        return queryFactory
                .selectFrom(performance)
                .where(performance.startTime.gt(LocalDateTime.now()))
                .orderBy(performance.startTime.asc())
                .limit(10)
                .fetch();
    }
    @Override
    public List<Performance> findPerformSoon() {
        return queryFactory
                .selectFrom(qPerformance)
                .where(performance.endTime.gt(LocalDateTime.now()))
                .where(performance.startTime.lt(LocalDateTime.now()))
                .orderBy(performance.endTime.asc())
                .limit(10)
                .fetch();
    }

    @Override
    public Page<Performance> findByCustom_cursorPaging(Pageable pageable, int cursorId) {

        List<Performance> performanceList = queryFactory
                .selectFrom(performance)
                .where(performance.endTime.gt(LocalDateTime.now()))
                .orderBy(performance.endTime.asc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory
                .select(performance.id)
                .from(performance)
                .fetchCount();

        return new PageImpl<>(performanceList, pageable, total);
    }

    @Override
    public List<Performance> findByCreatedUserId(String userId) {
        return queryFactory
                .selectFrom(performance)
                .where(performance.user.id.eq(userId))
                .fetch();
    }
}
