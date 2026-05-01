package com.ssafy.ttocket.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;

@Schema(description = "공연 DTO")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class PerformanceDto {
    @Schema(description = "공연 ID")
    @JsonProperty("performance_id")
    private int id;
    @Schema(description = "유저 ID")
    @JsonProperty("user_id")
    @NotNull(message = "유저 ID를 입력해주세요")
    private String userId;
    @Schema(description = "공연명")
    @NotNull(message = "공연명을 입력해주세요")
    private String title;
    @Schema(description = "티케팅 시작 시간")
    @JsonProperty("start_time")
    @NotNull(message = "공연 티켓팅 시작 시간을 입력해주세요")
    private String startTime;
    @Schema(description = "티케팅 마감 시간 = 공연 시작 시간")
    @JsonProperty("end_time")
    @NotNull(message = "공연 시작 시간을 알려주세요")
    private String endTime;
    @Schema(description = "공연 장소")
    @NotNull(message = "공연 장소를 알려주세요")
    private String location;
    @Schema(description = "티켓 가격")
    @DecimalMin(value = "0", inclusive = false, message = "가격은 0보다 커야 합니다")
    private double price;
    @Schema(description = "공연 최대 좌석 수")
    @JsonProperty("max_seats")
    @NotNull(message = "공연 최대 좌석 수를 알려주세요")
    private int maxSeats;
    @Schema(description = "공연 소개")
    @NotNull(message = "공연 소개를 입력해주세요")
    private String desc;
    @Schema(description = "공연 기타 정보")
    @NotNull(message = "공연 기타 정보를 알려주세요")
    private String etc;
    @Schema(description = "공연 포스터 url")
    @NotNull(message = "공연 포스터를 입력해주세요")
    private String poster;

}
