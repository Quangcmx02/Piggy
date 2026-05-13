package org.piggy.transactionservice.repository;
import org.piggy.transactionservice.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, String>, JpaSpecificationExecutor<Transaction> {
    List<Transaction> findByUserIdOrderByTransactionDateDesc(String userId);
    void deleteAllByWalletId(Long walletId);
    boolean existsByCategoryId(Long categoryId);
    List<Transaction> findByUserIdAndTransactionDateBetween(String userId, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
    @Modifying
    @Query("DELETE FROM Transaction t WHERE t.wallet.id = :walletId OR t.targetWallet.id = :walletId")
    void deleteAllRelatedTransactions(@org.springframework.data.repository.query.Param("walletId") Long walletId);
}