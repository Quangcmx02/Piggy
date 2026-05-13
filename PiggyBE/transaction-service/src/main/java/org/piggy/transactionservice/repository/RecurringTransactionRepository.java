package org.piggy.transactionservice.repository;

import org.piggy.transactionservice.entity.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, Long> {
    List<RecurringTransaction> findByUserId(String userId);
    List<RecurringTransaction> findByActiveTrueAndNextExecutionDateLessThanEqual(LocalDate date);
}
