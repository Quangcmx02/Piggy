package org.piggy.common.emums;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ExceptionErrorCode {

    UNKNOWN(0, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),

    FORBIDDEN(403, "Không được phép truy cập tài nguyên này.", HttpStatus.FORBIDDEN),

    NOT_FOUND(404, "Không tìm thấy tài nguyên.", HttpStatus.NOT_FOUND),

    VALIDATION_FAILED(400, "Dữ liệu không hợp lệ.", HttpStatus.BAD_REQUEST),

    UNAUTHORIZED(401, "Truy cập bị từ chối.", HttpStatus.UNAUTHORIZED),

    CREATE_FAILED(402, "Tạo mới thất bại.", HttpStatus.BAD_REQUEST),

    UPDATE_FAILED(407, "Cập nhật thất bại.", HttpStatus.BAD_REQUEST),

    DELETE_FAILED(405, "Xóa thất bại.", HttpStatus.BAD_REQUEST),

    REPOSITORY_ERROR(501, "Lỗi truy xuất dữ liệu.", HttpStatus.INTERNAL_SERVER_ERROR),

    DUPLICATE_VALUE(409, "Dữ liệu đã tồn tại.", HttpStatus.CONFLICT),

    INVALID_INPUT(406, "Dữ liệu đầu vào không hợp lệ.", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String defaultMessage;
    private final HttpStatus httpStatus;

    ExceptionErrorCode(int code, String defaultMessage, HttpStatus httpStatus) {
        this.code = code;
        this.defaultMessage = defaultMessage;
        this.httpStatus = httpStatus;
    }
}