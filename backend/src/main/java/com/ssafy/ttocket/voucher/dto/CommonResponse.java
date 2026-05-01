package com.ssafy.ttocket.voucher.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 공통 응답 형식
 * {
 *   "status_code": 200,
 *   "message": "success",
 *   "body": { ... }
 * }
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommonResponse<T> {

    @JsonProperty("status_code")
    private int statusCode;

    @JsonProperty("message")
    private String message;

    @JsonProperty("body")
    private T body;

    public static <T> CommonResponse<T> success(T body) {
        return CommonResponse.<T>builder()
                .statusCode(200)
                .message("success")
                .body(body)
                .build();
    }

    public static <T> CommonResponse<T> created(T body) {
        return CommonResponse.<T>builder()
                .statusCode(201)
                .message("created")
                .body(body)
                .build();
    }

    public static <T> CommonResponse<T> error(int statusCode, String message) {
        return CommonResponse.<T>builder()
                .statusCode(statusCode)
                .message(message)
                .body(null)
                .build();
    }
}
