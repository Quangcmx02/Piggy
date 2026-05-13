package org.piggy.common.exception;

import org.piggy.common.emums.ExceptionErrorCode;
import org.piggy.common.model.ResponseModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ResponseModel<Object>> handleCustomException(CustomException ex) {
        ResponseModel<Object> response = ResponseModel.exceptionResponse(
                ex.getMessage(),
                ex.getErrorCode().getCode()
        );
        return new ResponseEntity<>(response, ex.getHttpStatus());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseModel<Object>> handleGlobalException(Exception ex) {
        ResponseModel<Object> response = ResponseModel.exceptionResponse(
                ex.getMessage(),
                ExceptionErrorCode.UNKNOWN.getCode()
        );
        return new ResponseEntity<>(response, ExceptionErrorCode.UNKNOWN.getHttpStatus());
    }
}