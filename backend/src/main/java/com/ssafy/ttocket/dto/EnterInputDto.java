package com.ssafy.ttocket.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EnterInputDto {
    @JsonProperty("performId")
    private String performId;

    @JsonProperty("seatNum")
    private String seatNum;

    @JsonProperty("nickname")
    private String nickname;

    @JsonProperty("timeQR")
    private String timeQR;
}
