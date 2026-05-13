package org.piggy.transactionservice.controller;

import lombok.RequiredArgsConstructor;
import org.piggy.common.model.ResponseModel;
import org.piggy.transactionservice.dtos.response.CategoryResponse;
import org.piggy.transactionservice.services.ICategoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final ICategoryService categoryService;

    @GetMapping
    public ResponseModel<List<CategoryResponse>> getCategories(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseModel.successResponse(categoryService.getAvailableCategories(userId));
    }

    @GetMapping("/{id}")
    public ResponseModel<CategoryResponse> getCategory(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long id) {
        return ResponseModel.successResponse(categoryService.getCategoryById(userId, id));
    }

    @PostMapping
    public ResponseModel<CategoryResponse> createCategory(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody org.piggy.transactionservice.dtos.request.CategoryRequest request) {
        return ResponseModel.successResponse(categoryService.createCustomCategory(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseModel<CategoryResponse> updateCategory(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long id,
            @RequestBody org.piggy.transactionservice.dtos.request.CategoryRequest request) {
        return ResponseModel.successResponse(categoryService.updateCustomCategory(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseModel<String> deleteCategory(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long id) {
        categoryService.deleteCustomCategory(userId, id);
        return ResponseModel.successResponse("Xóa danh mục thành công");
    }
}