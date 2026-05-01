package com.ssafy.ttocket.repository.querydsl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.ttocket.domain.*;
import org.springframework.data.jpa.repository.support.QuerydslRepositorySupport;

import javax.persistence.EntityManager;

public class UserRepositoryImpl extends QuerydslRepositorySupport {

    private final JPAQueryFactory queryFactory;

    public UserRepositoryImpl(EntityManager em) {
        super(Performance.class);
        this.queryFactory = new JPAQueryFactory(em);
    }
}
