package org.piggy.transactionservice.config;

import lombok.RequiredArgsConstructor;
import org.piggy.transactionservice.constant.TransactionType;
import org.piggy.transactionservice.entity.Category;
import org.piggy.transactionservice.repository.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DbConfig {

    private final CategoryRepository categoryRepository;

    @Bean
    CommandLineRunner initDatabase() {
        return args -> {
            // Kiểm tra xem trong database đã có danh mục nào chưa
            if (categoryRepository.count() == 0) {

                // 1. Tạo các danh mục Chi tiêu (EXPENSE)
                Category food = Category.builder()
                        .name("Ăn uống")
                        .type(TransactionType.EXPENSE)
                        .build();

                Category transport = Category.builder()
                        .name("Đi lại")
                        .type(TransactionType.EXPENSE)
                        .build();

                Category shopping = Category.builder()
                        .name("Mua sắm")
                        .type(TransactionType.EXPENSE)
                        .build();

                // 2. Tạo các danh mục Thu nhập (INCOME)
                Category salary = Category.builder()
                        .name("Lương")
                        .type(TransactionType.INCOME)
                        .build();

                Category bonus = Category.builder()
                        .name("Thưởng")
                        .type(TransactionType.INCOME)
                        .build();
                Category transfer = Category.builder()
                        .name("Chuyển tiền")
                        .type(TransactionType.TRANSFER)
                        .build();
                categoryRepository.saveAll(List.of(food, transport, shopping, salary, bonus, transfer));

                System.out.println(">>> Đã khởi tạo các Danh mục (Category) mặc định thành công!");
            }
        };
    }
}