package org.piggy.transactionservice.controller;

import lombok.RequiredArgsConstructor;
import org.piggy.common.model.ResponseModel;
import org.piggy.transactionservice.dtos.request.RecurringTransactionRequest;
import org.piggy.transactionservice.dtos.response.RecurringTransactionResponse;
import org.piggy.transactionservice.services.IRecurringTransactionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring-transactions")
@RequiredArgsConstructor
public class RecurringTransactionController {

    private final IRecurringTransactionService recurringTransactionService;

    @PostMapping
    public ResponseModel<RecurringTransactionResponse> createRecurringTransaction(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Email") String email,
            @RequestBody RecurringTransactionRequest request) {
        return ResponseModel.successResponse(recurringTransactionService.createRecurringTransaction(userId, email, request));
    }

    @GetMapping
    public ResponseModel<List<RecurringTransactionResponse>> getMyRecurringTransactions(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseModel.successResponse(recurringTransactionService.getMyRecurringTransactions(userId));
    }

    @GetMapping("/{id}")
    public ResponseModel<RecurringTransactionResponse> getRecurringTransactionById(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long id) {
        return ResponseModel.successResponse(recurringTransactionService.getRecurringTransactionById(userId, id));
    }

    @PostMapping("/{id}/toggle")
    public ResponseModel<RecurringTransactionResponse> toggleRecurringTransactionStatus(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long id
          ) {
        return ResponseModel.successResponse(recurringTransactionService.toggleRecurringTransactionActive(userId, id));
    }

    @PutMapping("/{id}")
    public ResponseModel<RecurringTransactionResponse> updateRecurringTransaction(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long id,
            @RequestBody RecurringTransactionRequest request) {
        return ResponseModel.successResponse(recurringTransactionService.updateRecurringTransaction(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseModel<String> deleteRecurringTransaction(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long id) {
        recurringTransactionService.deleteRecurringTransaction(userId, id);
        return ResponseModel.successResponse("Xóa giao dịch định kỳ thành công");
    }
}
