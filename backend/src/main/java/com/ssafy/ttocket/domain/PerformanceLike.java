package com.ssafy.ttocket.domain;

import lombok.*;

import javax.persistence.*;
import java.io.Serializable;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PerformanceLike implements Serializable {
    @EmbeddedId
    private LikeId likeId;


    @ManyToOne(optional = false)
    @JoinColumn(name="performance_id")
    @MapsId("performanceId")
    private Performance performance;

    @ManyToOne(optional = false)
    @JoinColumn(name="user_id")
    @MapsId("userId")
    private User user;

    @Column(name="is_like", columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean isLike;

}
