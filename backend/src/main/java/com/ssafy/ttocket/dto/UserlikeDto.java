package com.ssafy.ttocket.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

@Schema(description = "유저 좋아요 DTO")
@Data
@Builder
public class UserlikeDto {
    @Schema(description = "유저 ID")
    @JsonProperty("user_id")
    private String id;
    @Schema(description = "공연명")
    private String title;
    @Schema(description = "티켓팅 시작 시간")
    @JsonProperty("start_time")
    private String startTime;
    @Schema(description = "티케팅 마감 시간 = 공연 시작 시간")
    @JsonProperty("end_time")
    private String endTime;
    @Schema(description = "공연 장소")
    private String location;
    @Schema(description = "공연 포스터")
    private String poster;
    @Schema(description = "티켓 가격")
    private double price;
    @Schema(description = "공연 최대 좌석 수")
    @JsonProperty("max_seats")
    private int maxSeats;
    @Schema(description = "공연 소개")
    private String description;
    @Schema(description = "공연 기타 정보")
    private String etc;

}
