package org.piggy.transactionservice.services;

import lombok.RequiredArgsConstructor;
import org.piggy.common.emums.ExceptionErrorCode;
import org.piggy.common.exception.CustomException;
import org.piggy.transactionservice.dtos.request.RecurringTransactionRequest;
import org.piggy.transactionservice.dtos.response.RecurringTransactionResponse;
import org.piggy.transactionservice.entity.RecurringTransaction;
import org.piggy.transactionservice.repository.CategoryRepository;
import org.piggy.transactionservice.repository.RecurringTransactionRepository;
import org.piggy.transactionservice.repository.WalletRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecurringTransactionServiceImpl implements IRecurringTransactionService {

    private final RecurringTransactionRepository recurringTransactionRepository;
    private final WalletRepository walletRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public RecurringTransactionResponse createRecurringTransaction(String userId, String email, RecurringTransactionRequest request) {
        // Validate
        if (!walletRepository.existsByIdAndUserId(request.getWalletId(), userId)) {
            throw new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy ví");
        }
        if (!categoryRepository.existsById(request.getCategoryId())) {
            throw new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy danh mục");
        }

        RecurringTransaction recurringTransaction = RecurringTransaction.builder()
                .userId(userId)
                .email(email)
                .name(request.getName())
                .walletId(request.getWalletId())
                .categoryId(request.getCategoryId())
                .amount(request.getAmount())
                .frequency(request.getFrequency())
                .nextExecutionDate(request.getNextExecutionDate())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        recurringTransaction = recurringTransactionRepository.save(recurringTransaction);
        return RecurringTransactionResponse.fromEntity(recurringTransaction);
    }

    @Override
    public List<RecurringTransactionResponse> getMyRecurringTransactions(String userId) {
        return recurringTransactionRepository.findByUserId(userId)
                .stream()
                .map(RecurringTransactionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public RecurringTransactionResponse getRecurringTransactionById(String userId, Long recurringTransactionId) {
        RecurringTransaction recurringTransaction = recurringTransactionRepository.findById(recurringTransactionId)
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy giao dịch định kỳ"));

        if (!recurringTransaction.getUserId().equals(userId)) {
            throw new CustomException(ExceptionErrorCode.UNAUTHORIZED, "Bạn không có quyền xem giao dịch định kỳ này");
        }
        
        return RecurringTransactionResponse.fromEntity(recurringTransaction);
    }

    @Override
    public RecurringTransactionResponse toggleRecurringTransactionActive(String userId, Long id) {
        RecurringTransaction recurringTransaction = recurringTransactionRepository.findById(id)
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy giao dịch định kỳ"));

        if (!recurringTransaction.getUserId().equals(userId)) {
            throw new CustomException(ExceptionErrorCode.UNAUTHORIZED, "Bạn không có quyền sửa giao dịch định kỳ này");
        }

        recurringTransaction.setActive(!recurringTransaction.isActive());

        recurringTransaction = recurringTransactionRepository.save(recurringTransaction);
        return RecurringTransactionResponse.fromEntity(recurringTransaction);
    }
    @Override
    public RecurringTransactionResponse updateRecurringTransaction(String userId, Long recurringTransactionId, RecurringTransactionRequest request) {
        RecurringTransaction recurringTransaction = recurringTransactionRepository.findById(recurringTransactionId)
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy giao dịch định kỳ"));

        if (!recurringTransaction.getUserId().equals(userId)) {
            throw new CustomException(ExceptionErrorCode.UNAUTHORIZED, "Bạn không có quyền sửa giao dịch định kỳ này");
        }

        if (request.getName() != null) recurringTransaction.setName(request.getName());
        if (request.getAmount() != null) recurringTransaction.setAmount(request.getAmount());
        if (request.getFrequency() != null) recurringTransaction.setFrequency(request.getFrequency());
        if (request.getNextExecutionDate() != null) recurringTransaction.setNextExecutionDate(request.getNextExecutionDate());
        if (request.getActive() != null) recurringTransaction.setActive(request.getActive());
        
        if (request.getWalletId() != null) {
            if (!walletRepository.existsByIdAndUserId(request.getWalletId(), userId)) {
                throw new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy ví");
            }
            recurringTransaction.setWalletId(request.getWalletId());
        }

        if (request.getCategoryId() != null) {
            if (!categoryRepository.existsById(request.getCategoryId())) {
                throw new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy danh mục");
            }
            recurringTransaction.setCategoryId(request.getCategoryId());
        }

        recurringTransaction = recurringTransactionRepository.save(recurringTransaction);
        return RecurringTransactionResponse.fromEntity(recurringTransaction);
    }

    @Override
    public void deleteRecurringTransaction(String userId, Long recurringTransactionId) {
        RecurringTransaction recurringTransaction = recurringTransactionRepository.findById(recurringTransactionId)
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy giao dịch định kỳ"));

        if (!recurringTransaction.getUserId().equals(userId)) {
            throw new CustomException(ExceptionErrorCode.UNAUTHORIZED, "Bạn không có quyền xóa giao dịch định kỳ này");
        }

        recurringTransactionRepository.delete(recurringTransaction);
    }
}
