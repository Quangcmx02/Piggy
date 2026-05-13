package org.piggy.transactionservice.services;
import lombok.RequiredArgsConstructor;
import org.piggy.common.emums.ExceptionErrorCode;
import org.piggy.common.exception.CustomException;
import org.piggy.transactionservice.constant.TransactionType;
import org.piggy.transactionservice.dtos.request.TransactionRequest;
import org.piggy.transactionservice.dtos.response.TransactionResponse;
import org.piggy.transactionservice.entity.Category;
import org.piggy.transactionservice.entity.Transaction;
import org.piggy.transactionservice.entity.Wallet;
import org.piggy.transactionservice.repository.CategoryRepository;
import org.piggy.transactionservice.repository.TransactionRepository;
import org.piggy.transactionservice.repository.WalletRepository;
import org.piggy.transactionservice.services.ITransactionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements ITransactionService {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    public TransactionResponse createTransaction(String userId, TransactionRequest request) {

        // 1. Lấy Ví nguồn
        Wallet wallet = walletRepository.findByIdAndUserId(request.getWalletId(), userId)
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy ví"));

        Category category;
        Wallet targetWallet = null;

        // 2. LOGIC TỰ ĐỘNG NHẬN DIỆN (CHUYỂN TIỀN vs THU CHI THƯỜNG)
        if (request.getTargetWalletId() != null) {
            // NẾU LÀ CHUYỂN TIỀN: Tự động lấy danh mục TRANSFER của hệ thống
            category = categoryRepository.findByType(TransactionType.TRANSFER).stream().findFirst()
                    .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Hệ thống thiếu danh mục Chuyển tiền"));

            if (wallet.getId().equals(request.getTargetWalletId())) {
                throw new CustomException(ExceptionErrorCode.VALIDATION_FAILED, "Ví nhận và ví chuyển không được trùng nhau");
            }
            targetWallet = walletRepository.findByIdAndUserId(request.getTargetWalletId(), userId)
                    .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy ví nhận"));

        } else {
            // NẾU LÀ THU/CHI THƯỜNG: Bắt buộc Frontend phải gửi categoryId
            if (request.getCategoryId() == null) {
                throw new CustomException(ExceptionErrorCode.VALIDATION_FAILED, "Vui lòng chọn danh mục");
            }
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Danh mục không tồn tại"));
        }

        // 3. XỬ LÝ SỐ DƯ VÀ TẠO RECORD
        if (category.getType() == TransactionType.TRANSFER) {
            // --- XỬ LÝ CHUYỂN TIỀN ---
            if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
                throw new CustomException(ExceptionErrorCode.VALIDATION_FAILED, "Số dư ví không đủ để chuyển");
            }

            // Cập nhật số dư 2 ví
            wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
            targetWallet.setBalance(targetWallet.getBalance().add(request.getAmount()));
            walletRepository.save(wallet);
            walletRepository.save(targetWallet);

            // Record 1: Ví Nguồn bị TRỪ tiền (amount mang số âm)
            Transaction txOut = Transaction.builder()
                    .userId(userId).wallet(wallet).targetWallet(targetWallet).category(category)
                    .amount(request.getAmount().negate()) // Số âm
                    .note(request.getNote() != null ? request.getNote() : "Chuyển tiền đến " + targetWallet.getName())
                    .transactionDate(request.getTransactionDate() != null ? request.getTransactionDate() : LocalDateTime.now())
                    .build();
            transactionRepository.save(txOut);

            // Record 2: Ví Đích được CỘNG tiền
            Transaction txIn = Transaction.builder()
                    .userId(userId).wallet(targetWallet).targetWallet(wallet).category(category)
                    .amount(request.getAmount()) // Số dương
                    .note("Nhận tiền từ " + wallet.getName())
                    .transactionDate(txOut.getTransactionDate())
                    .build();
            txIn = transactionRepository.save(txIn);

            return TransactionResponse.fromEntity(txOut); // Trả về giao dịch gốc cho Frontend

        } else {
            // --- XỬ LÝ THU/CHI BÌNH THƯỜNG ---
            if (category.getType() == TransactionType.EXPENSE) {
                if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
                    throw new CustomException(ExceptionErrorCode.VALIDATION_FAILED, "Số dư ví không đủ");
                }
                wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));

            } else if (category.getType() == TransactionType.INCOME) {
                wallet.setBalance(wallet.getBalance().add(request.getAmount()));
            }
            walletRepository.save(wallet);

            Transaction transaction = Transaction.builder()
                    .userId(userId).wallet(wallet).category(category)
                    .amount(request.getAmount())
                    .note(request.getNote())
                    .transactionDate(request.getTransactionDate() != null ? request.getTransactionDate() : LocalDateTime.now())
                    .build();
            transaction = transactionRepository.save(transaction);

            return TransactionResponse.fromEntity(transaction);
        }
    }
    @Override
    public org.piggy.common.model.PageResponse<TransactionResponse> getMyTransactions(String userId, LocalDateTime startDate, LocalDateTime endDate, Long walletId, Long categoryId, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("transactionDate").descending());

        org.springframework.data.jpa.domain.Specification<Transaction> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            predicates.add(cb.equal(root.get("userId"), userId));

            if (startDate != null && endDate != null) {
                predicates.add(cb.between(root.get("transactionDate"), startDate, endDate));
            } else if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("transactionDate"), startDate));
            } else if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("transactionDate"), endDate));
            }

            if (walletId != null) {
                predicates.add(cb.equal(root.get("wallet").get("id"), walletId));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        org.springframework.data.domain.Page<Transaction> transactionPage = transactionRepository.findAll(spec, pageable);

        List<TransactionResponse> content = transactionPage.getContent()
                .stream()
                .map(TransactionResponse::fromEntity)
                .collect(Collectors.toList());

        return org.piggy.common.model.PageResponse.<TransactionResponse>builder()
                .content(content)
                .pageNumber(transactionPage.getNumber())
                .pageSize(transactionPage.getSize())
                .totalCount(transactionPage.getTotalElements())
                .totalPages(transactionPage.getTotalPages())
                .last(transactionPage.isLast())
                .build();
    }

    @Override
    public TransactionResponse getTransactionById(String userId, String transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy giao dịch"));

        if (!transaction.getUserId().equals(userId)) {
            throw new CustomException(ExceptionErrorCode.UNAUTHORIZED, "Bạn không có quyền xem giao dịch này");
        }

        return TransactionResponse.fromEntity(transaction);
    }

    @Override
    @Transactional
    public TransactionResponse updateTransaction(String userId, String transactionId, TransactionRequest request) {
        Transaction oldTransaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy giao dịch"));

        if (!oldTransaction.getUserId().equals(userId)) {
            throw new CustomException(ExceptionErrorCode.UNAUTHORIZED, "Bạn không có quyền sửa giao dịch này");
        }

        if (oldTransaction.getCategory().getType() == TransactionType.TRANSFER) {
            throw new CustomException(ExceptionErrorCode.VALIDATION_FAILED, "Không thể sửa giao dịch chuyển tiền");
        }

        Wallet oldWallet = oldTransaction.getWallet();
        Category oldCategory = oldTransaction.getCategory();

        // Hoàn lại tiền cho ví cũ
        if (oldCategory.getType() == TransactionType.EXPENSE) {
            oldWallet.setBalance(oldWallet.getBalance().add(oldTransaction.getAmount()));
        } else if (oldCategory.getType() == TransactionType.INCOME) {
            oldWallet.setBalance(oldWallet.getBalance().subtract(oldTransaction.getAmount()));
        }
        walletRepository.save(oldWallet);

        // Lấy thông tin mới
        Wallet newWallet = walletRepository.findByIdAndUserId(request.getWalletId(), userId)
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy ví"));
        Category newCategory = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Danh mục không tồn tại"));

        // Trừ/Cộng tiền vào ví mới (hoặc ví cũ nếu không đổi ví)
        if (newCategory.getType() == TransactionType.EXPENSE) {
            if (newWallet.getBalance().compareTo(request.getAmount()) < 0) {
                // Phải khôi phục lại ví cũ nếu lỗi
                throw new CustomException(ExceptionErrorCode.VALIDATION_FAILED, "Số dư ví không đủ");
            }
            newWallet.setBalance(newWallet.getBalance().subtract(request.getAmount()));
        } else if (newCategory.getType() == TransactionType.INCOME) {
            newWallet.setBalance(newWallet.getBalance().add(request.getAmount()));
        }
        walletRepository.save(newWallet);

        // Cập nhật giao dịch
        oldTransaction.setWallet(newWallet);
        oldTransaction.setCategory(newCategory);
        oldTransaction.setAmount(request.getAmount());
        oldTransaction.setNote(request.getNote());
        if (request.getTransactionDate() != null) {
            oldTransaction.setTransactionDate(request.getTransactionDate());
        }

        oldTransaction = transactionRepository.save(oldTransaction);
        return TransactionResponse.fromEntity(oldTransaction);
    }

    @Override
    @Transactional
    public void deleteTransaction(String userId, String transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new CustomException(ExceptionErrorCode.NOT_FOUND, "Không tìm thấy giao dịch"));

        if (!transaction.getUserId().equals(userId)) {
            throw new CustomException(ExceptionErrorCode.UNAUTHORIZED, "Bạn không có quyền xóa giao dịch này");
        }

        if (transaction.getCategory().getType() == TransactionType.TRANSFER) {
            throw new CustomException(ExceptionErrorCode.VALIDATION_FAILED, "Không thể xóa giao dịch chuyển tiền");
        }

        Wallet wallet = transaction.getWallet();
        Category category = transaction.getCategory();

        // Hoàn lại tiền cho ví
        if (category.getType() == TransactionType.EXPENSE) {
            wallet.setBalance(wallet.getBalance().add(transaction.getAmount()));
        } else if (category.getType() == TransactionType.INCOME) {
            wallet.setBalance(wallet.getBalance().subtract(transaction.getAmount()));
        }
        walletRepository.save(wallet);

        // Xóa giao dịch
        transactionRepository.delete(transaction);
    }
}