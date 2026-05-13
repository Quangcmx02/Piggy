package org.piggy.transactionservice.repository;

import org.piggy.transactionservice.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, Long> {
    List<Wallet> findByUserId(String userId);
    Optional<Wallet> findByIdAndUserId(Long id, String userId);
    boolean existsByUserIdAndName(String userId, String name);
    boolean existsByIdAndUserId(Long id, String userId);


}