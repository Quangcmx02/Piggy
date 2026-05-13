package org.piggy.transactionservice.controller;
import lombok.RequiredArgsConstructor;
import org.piggy.common.model.ResponseModel;
import org.piggy.transactionservice.dtos.request.TransactionRequest;
import org.piggy.transactionservice.dtos.response.TransactionResponse;
import org.piggy.transactionservice.services.ITransactionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final ITransactionService transactionService;

    // API tạo giao dịch thu/chi
    @PostMapping
    public ResponseModel<TransactionResponse> createTransaction(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody TransactionRequest request) {

        TransactionResponse result = transactionService.createTransaction(userId, request);
        return ResponseModel.successResponse(result);
    }

    // API lấy lịch sử giao dịch của user đang đăng nhập
    @GetMapping
    public ResponseModel<org.piggy.common.model.PageResponse<TransactionResponse>> getMyTransactions(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime endDate,
            @RequestParam(required = false) Long walletId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        org.piggy.common.model.PageResponse<TransactionResponse> result = transactionService.getMyTransactions(userId, startDate, endDate, walletId, categoryId, page, size);
        return ResponseModel.successResponse(result);
    }

    @GetMapping("/{id}")
    public ResponseModel<TransactionResponse> getTransaction(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String id) {
        return ResponseModel.successResponse(transactionService.getTransactionById(userId, id));
    }

    @PutMapping("/{id}")
    public ResponseModel<TransactionResponse> updateTransaction(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String id,
            @RequestBody TransactionRequest request) {

        TransactionResponse result = transactionService.updateTransaction(userId, id, request);
        return ResponseModel.successResponse(result);
    }

    @DeleteMapping("/{id}")
    public ResponseModel<String> deleteTransaction(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String id) {

        transactionService.deleteTransaction(userId, id);
        return ResponseModel.successResponse("Xóa giao dịch thành công");
    }
}