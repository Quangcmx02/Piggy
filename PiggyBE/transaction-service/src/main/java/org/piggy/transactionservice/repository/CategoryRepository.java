package org.piggy.transactionservice.repository;
import org.piggy.transactionservice.constant.TransactionType;
import org.piggy.transactionservice.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserIdIsNullOrUserId(String userId);
    List<Category> findByType(TransactionType type);
}