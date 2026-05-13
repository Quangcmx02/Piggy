package org.piggy.transactionservice.services;
import org.piggy.transactionservice.dtos.response.CategoryResponse; // Nhớ tạo DTO này
import java.util.List;

public interface ICategoryService {
    List<CategoryResponse> getAvailableCategories(String userId);
    CategoryResponse getCategoryById(String userId, Long categoryId);
    CategoryResponse createCustomCategory(String userId, org.piggy.transactionservice.dtos.request.CategoryRequest request);
    CategoryResponse updateCustomCategory(String userId, Long categoryId, org.piggy.transactionservice.dtos.request.CategoryRequest request);
    void deleteCustomCategory(String userId, Long categoryId);
}