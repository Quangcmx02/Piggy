package org.piggy.transactionservice.services;

import org.piggy.transactionservice.dtos.request.TransactionRequest;
import org.piggy.transactionservice.dtos.response.TransactionResponse;
import java.util.List;

import org.piggy.common.model.PageResponse;
import java.time.LocalDateTime;

public interface ITransactionService {
    TransactionResponse createTransaction(String userId, TransactionRequest request);
    PageResponse<TransactionResponse> getMyTransactions(String userId, LocalDateTime startDate, LocalDateTime endDate, Long walletId, Long categoryId, int page, int size);
    TransactionResponse getTransactionById(String userId, String transactionId);
    TransactionResponse updateTransaction(String userId, String transactionId, TransactionRequest request);
    void deleteTransaction(String userId, String transactionId);
}