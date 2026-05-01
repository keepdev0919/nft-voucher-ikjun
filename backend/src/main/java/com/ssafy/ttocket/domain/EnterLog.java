package com.ssafy.ttocket.domain;

import lombok.*;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EnterLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="enterlog_id")
    private int EnterLogId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="performance_id")
    private Performance performance;

    @Column(name="enterlog_nickname")
    private String nickname;

    @Column(name="enterlog_time")
    private LocalDateTime enterTime;

    @Column(name="enterlog_seat_no")
    private int seatNum;
}
