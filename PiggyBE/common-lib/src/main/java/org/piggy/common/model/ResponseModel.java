package org.piggy.common.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResponseModel<T> {

    private int code;
    private String message;
    private T data;

    public boolean isSuccess() {
        return this.code == 0;
    }
    public static <T> ResponseModel<T> successResponse(T data) {
        return new ResponseModel<>(0, "Thành công", data);
    }
    public static <T> ResponseModel<T> successResponse() {
        return new ResponseModel<>(0, "Thành công", null);
    }
    public static <T> ResponseModel<T> failureResponse(String message) {
        return new ResponseModel<>(1, message, null);
    }

    public static <T> ResponseModel<T> exceptionResponse(String error, int code) {
        return new ResponseModel<>(code, error != null ? error : "Đã có lỗi xảy ra, thử lại sau", null);
    }
}