package com.ssafy.ttocket.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class LikeId implements Serializable {
    @Column(name="performance_id")
    private int performanceId;

    @Column(name="user_id")
    private String userId;
}

