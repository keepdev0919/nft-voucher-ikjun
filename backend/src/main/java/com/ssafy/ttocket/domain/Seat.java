package com.ssafy.ttocket.domain;

import com.sun.istack.NotNull;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import javax.persistence.*;
import java.io.Serializable;

@Data
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Seat implements Serializable {
    @EmbeddedId
    private SeatId seatId;

    @ManyToOne(optional = false)
    @JoinColumn(name="performance_id")
    @MapsId("performanceId")
    private Performance performance;

    @Column(name="seat_no",insertable = false,updatable = false)
    private int seatNo;


    @NotNull
    @ColumnDefault("'EMPTY'")
    @Enumerated(EnumType.STRING)
    private SeatStatus status;
}
