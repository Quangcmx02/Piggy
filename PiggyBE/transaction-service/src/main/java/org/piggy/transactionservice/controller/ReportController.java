package org.piggy.transactionservice.controller;

import lombok.RequiredArgsConstructor;
import org.piggy.common.model.ResponseModel;
import org.piggy.transactionservice.dtos.response.CategoryBreakdownResponse;
import org.piggy.transactionservice.dtos.response.MonthlySummaryResponse;
import org.piggy.transactionservice.services.IReportService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final IReportService reportService;

    @GetMapping("/monthly-summary")
    public ResponseModel<MonthlySummaryResponse> getMonthlySummary(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseModel.successResponse(reportService.getMonthlySummary(userId, year, month));
    }

    @GetMapping("/category-breakdown")
    public ResponseModel<List<CategoryBreakdownResponse>> getCategoryBreakdown(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseModel.successResponse(reportService.getCategoryBreakdown(userId, year, month));
    }
}
