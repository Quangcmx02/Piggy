package org.piggy.transactionservice.services;

import lombok.RequiredArgsConstructor;
import org.piggy.transactionservice.constant.TransactionType;
import org.piggy.transactionservice.dtos.response.CategoryBreakdownResponse;
import org.piggy.transactionservice.dtos.response.MonthlySummaryResponse;
import org.piggy.transactionservice.entity.Transaction;
import org.piggy.transactionservice.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements IReportService {

    private final TransactionRepository transactionRepository;

    @Override
    public MonthlySummaryResponse getMonthlySummary(String userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime startDate = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59, 999999999);

        List<Transaction> transactions = transactionRepository.findByUserIdAndTransactionDateBetween(userId, startDate, endDate);

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (Transaction t : transactions) {
            if (t.getCategory().getType() == TransactionType.INCOME) {
                totalIncome = totalIncome.add(t.getAmount());
            } else if (t.getCategory().getType() == TransactionType.EXPENSE) {
                totalExpense = totalExpense.add(t.getAmount());
            }
        }

        return MonthlySummaryResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .build();
    }

    @Override
    public List<CategoryBreakdownResponse> getCategoryBreakdown(String userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime startDate = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59, 999999999);

        List<Transaction> transactions = transactionRepository.findByUserIdAndTransactionDateBetween(userId, startDate, endDate);

        // Lọc chỉ lấy EXPENSE
        List<Transaction> expenses = transactions.stream()
                .filter(t -> t.getCategory().getType() == TransactionType.EXPENSE)
                .collect(Collectors.toList());

        BigDecimal totalExpense = expenses.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Nhóm theo Category
        Map<org.piggy.transactionservice.entity.Category, BigDecimal> categoryTotals = expenses.stream()
                .collect(Collectors.groupingBy(
                        Transaction::getCategory,
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                Transaction::getAmount,
                                BigDecimal::add
                        )
                ));

        return categoryTotals.entrySet().stream()
                .map(entry -> {
                    org.piggy.transactionservice.entity.Category category = entry.getKey();
                    BigDecimal amount = entry.getValue();
                    double percentage = 0.0;
                    if (totalExpense.compareTo(BigDecimal.ZERO) > 0) {
                        percentage = amount.divide(totalExpense, 4, RoundingMode.HALF_UP)
                                .multiply(new BigDecimal("100"))
                                .doubleValue();
                    }

                    return CategoryBreakdownResponse.builder()
                            .categoryId(category.getId())
                            .categoryName(category.getName())
                            .categoryIcon(category.getIcon())
                            .totalAmount(amount)
                            .percentage(percentage)
                            .build();
                })
                .sorted((a, b) -> b.getTotalAmount().compareTo(a.getTotalAmount()))
                .collect(Collectors.toList());
    }
}
