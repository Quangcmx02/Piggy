package org.piggy.transactionservice.services;

import org.piggy.transactionservice.dtos.response.CategoryBreakdownResponse;
import org.piggy.transactionservice.dtos.response.MonthlySummaryResponse;

import java.util.List;

public interface IReportService {
    MonthlySummaryResponse getMonthlySummary(String userId, int year, int month);
    List<CategoryBreakdownResponse> getCategoryBreakdown(String userId, int year, int month);
}
