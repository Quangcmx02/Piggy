package org.piggy.transactionservice.services;

import org.piggy.transactionservice.dtos.request.WalletRequest;
import org.piggy.transactionservice.dtos.response.WalletResponse;
import java.util.List;

public interface IWalletService {
    WalletResponse createWallet(String userId, WalletRequest request);
    List<WalletResponse> getMyWallets(String userId);
    WalletResponse getWalletById(String userId, Long walletId);
    WalletResponse updateWallet(String userId, Long walletId, WalletRequest request);
    void deleteWallet(String userId, Long walletId);
}