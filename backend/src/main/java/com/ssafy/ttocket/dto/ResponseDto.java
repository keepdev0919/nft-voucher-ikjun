package com.ssafy.ttocket.dto;


import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Schema(description = "데이터 응답 DTO")
@Data
public class ResponseDto<T> {
    @Schema(description = "전송 상태") 
    @JsonProperty("status_code")
    private int statusCode;
    @Schema(description = "전송 메시지")
    @JsonProperty("message")
    private String message;

    @Schema(description = "전송 데이터")
    @JsonProperty("body")
    private T body;
}
