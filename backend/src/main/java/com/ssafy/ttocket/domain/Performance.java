package com.ssafy.ttocket.domain;

import com.sun.istack.NotNull;
import lombok.*;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class Performance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="performance_id")
    private int id;

    @NotNull
    @Column(name="performance_title")
    private String title;

    @OneToOne(fetch = FetchType.EAGER)  // LAZY에서 EARGER로 변경: home에서 likelist를 가져올 때 필요
    @JoinColumn(name="user_id")
    private User user;

    @Column(name="performance_desc")
    private String description;

    @NotNull
    @Column(name="performance_max_seats")
    private int max_seats;

    @Column(name="performance_location")
    private String location;

    @NotNull
    @Column(name="performance_price")
    private double price; // int 값 인지 물어봐야함

   
    @Column(name="performance_start_time")
    private LocalDateTime startTime;


    @Column(name="performance_end_time")
    private LocalDateTime endTime;

    @NotNull
    @Column(name="performance_poster")
    private String poster;

    @Column(name="performance_etc")
    private String etc;

}
