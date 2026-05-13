package org.piggy.transactionservice.controller;

import lombok.RequiredArgsConstructor;
import org.piggy.common.model.ResponseModel;
import org.piggy.transactionservice.dtos.request.WalletRequest;
import org.piggy.transactionservice.dtos.response.WalletResponse;
import org.piggy.transactionservice.services.IWalletService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final IWalletService walletService;

    @PostMapping
    public ResponseModel<WalletResponse> createWallet(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody WalletRequest request) {
        return ResponseModel.successResponse(walletService.createWallet(userId, request));
    }

    @GetMapping
    public ResponseModel<List<WalletResponse>> getMyWallets(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseModel.successResponse(walletService.getMyWallets(userId));
    }

    @GetMapping("/{id}")
    public ResponseModel<WalletResponse> getWallet(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long id) {
        return ResponseModel.successResponse(walletService.getWalletById(userId, id));
    }

    @PutMapping("/{id}")
    public ResponseModel<WalletResponse> updateWallet(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long id,
            @RequestBody WalletRequest request) {
        return ResponseModel.successResponse(walletService.updateWallet(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseModel<String> deleteWallet(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long id) {
        walletService.deleteWallet(userId, id);
        return ResponseModel.successResponse("Xóa ví thành công");
    }
}