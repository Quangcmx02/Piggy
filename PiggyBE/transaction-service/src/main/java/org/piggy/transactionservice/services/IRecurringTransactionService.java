package org.piggy.transactionservice.services;

import org.piggy.transactionservice.dtos.request.RecurringTransactionRequest;
import org.piggy.transactionservice.dtos.response.RecurringTransactionResponse;

import java.util.List;

public interface IRecurringTransactionService {
    RecurringTransactionResponse createRecurringTransaction(String userId, String email, RecurringTransactionRequest request);
    List<RecurringTransactionResponse> getMyRecurringTransactions(String userId);
    RecurringTransactionResponse getRecurringTransactionById(String userId, Long recurringTransactionId);
    RecurringTransactionResponse updateRecurringTransaction(String userId, Long recurringTransactionId, RecurringTransactionRequest request);
    RecurringTransactionResponse toggleRecurringTransactionActive(String userId, Long recurringTransactionId);
    void deleteRecurringTransaction(String userId, Long recurringTransactionId);
}
