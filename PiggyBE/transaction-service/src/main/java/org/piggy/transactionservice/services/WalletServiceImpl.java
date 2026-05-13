package org.piggy.transactionservice.services;

import lombok.RequiredArgsConstructor;
import org.piggy.transactionservice.dtos.request.WalletRequest;
import org.piggy.transactionservice.dtos.response.WalletResponse;
import org.piggy.transactionservice.entity.Wallet;
import org.piggy.transactionservice.repository.WalletRepository;
import org.piggy.transactionservice.services.IWalletService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements IWalletService {

    private final WalletRepository walletRepository;
    private final org.piggy.transactionservice.repository.TransactionRepository transactionRepository;

    @Override
    public WalletResponse createWallet(String userId, WalletRequest request) {


        if (walletRepository.existsByUserIdAndName(userId, request.getName())) {
            throw new RuntimeException("Tên ví đã tồn tại");
        }

        Wallet wallet = Wallet.builder()
                .userId(userId)
                .name(request.getName())
                .balance(request.getInitialBalance())
                .currency(request.getCurrency() != null ? request.getCurrency() : "VND")
                .build();

        wallet = walletRepository.save(wallet);

        return WalletResponse.fromEntity(wallet);
    }

    @Override
    public List<WalletResponse> getMyWallets(String userId) {
        return walletRepository.findByUserId(userId)
                .stream()
                .map(WalletResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public WalletResponse getWalletById(String userId, Long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new org.piggy.common.exception.CustomException(org.piggy.common.emums.ExceptionErrorCode.NOT_FOUND, "Không tìm thấy ví"));

        if (!wallet.getUserId().equals(userId)) {
            throw new org.piggy.common.exception.CustomException(org.piggy.common.emums.ExceptionErrorCode.UNAUTHORIZED, "Bạn không có quyền xem ví này");
        }

        return WalletResponse.fromEntity(wallet);
    }

    @Override
    public WalletResponse updateWallet(String userId, Long walletId, WalletRequest request) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new org.piggy.common.exception.CustomException(org.piggy.common.emums.ExceptionErrorCode.NOT_FOUND, "Không tìm thấy ví"));

        if (!wallet.getUserId().equals(userId)) {
            throw new org.piggy.common.exception.CustomException(org.piggy.common.emums.ExceptionErrorCode.UNAUTHORIZED, "Bạn không có quyền sửa ví này");
        }

        if (request.getName() != null) {
            wallet.setName(request.getName());
        }
        if (request.getInitialBalance() != null) {
            wallet.setBalance(request.getInitialBalance()); // Override balance
        }
        if (request.getCurrency() != null) {
            wallet.setCurrency(request.getCurrency());
        }

        wallet = walletRepository.save(wallet);
        return WalletResponse.fromEntity(wallet);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void deleteWallet(String userId, Long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new org.piggy.common.exception.CustomException(org.piggy.common.emums.ExceptionErrorCode.NOT_FOUND, "Không tìm thấy ví"));

        if (!wallet.getUserId().equals(userId)) {
            throw new org.piggy.common.exception.CustomException(org.piggy.common.emums.ExceptionErrorCode.UNAUTHORIZED, "Bạn không có quyền xóa ví này");
        }


        transactionRepository.deleteAllRelatedTransactions(walletId);

        walletRepository.delete(wallet);
    }}