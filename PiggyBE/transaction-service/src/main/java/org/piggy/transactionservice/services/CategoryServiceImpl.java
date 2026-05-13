package org.piggy.transactionservice.services;

import lombok.RequiredArgsConstructor;
import org.piggy.transactionservice.constant.TransactionType;
import org.piggy.transactionservice.dtos.response.CategoryResponse;
import org.piggy.transactionservice.repository.CategoryRepository;
import org.piggy.transactionservice.services.ICategoryService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements ICategoryService {

    private final CategoryRepository categoryRepository;
    private final org.piggy.transactionservice.repository.TransactionRepository transactionRepository;

    @Override
    public List<CategoryResponse> getAvailableCategories(String userId) {
        // Lấy cả danh mục chung (null) và danh mục riêng của user
        return categoryRepository.findByUserIdIsNullOrUserId(userId)
                .stream()
                .filter(category -> category.getType() != TransactionType.TRANSFER)
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponse getCategoryById(String userId, Long categoryId) {
        org.piggy.transactionservice.entity.Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new org.piggy.common.exception.CustomException(org.piggy.common.emums.ExceptionErrorCode.NOT_FOUND, "Không tìm thấy danh mục"));
        
        if (category.getUserId() != null && !category.getUserId().equals(userId)) {
            throw new org.piggy.common.exception.CustomException(org.piggy.common.emums.ExceptionErrorCode.UNAUTHORIZED, "Bạn không có quyền xem danh mục này");
        }
        return CategoryResponse.fromEntity(category);
    }

    @Override
    public CategoryResponse createCustomCategory(String userId, org.piggy.transactionservice.dtos.request.CategoryRequest request) {
        org.piggy.transactionservice.entity.Category category = org.piggy.transactionservice.entity.Category.builder()
                .userId(userId)
                .name(request.getName())
                .icon(request.getIcon())
                .type(request.getType())
                .build();
        category = categoryRepository.save(category);
        return CategoryResponse.fromEntity(category);
    }

    @Override
    public CategoryResponse updateCustomCategory(String userId, Long categoryId, org.piggy.transactionservice.dtos.request.CategoryRequest request) {
        org.piggy.transactionservice.entity.Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new org.piggy.common.exception.CustomException(org.piggy.common.emums.ExceptionErrorCode.NOT_FOUND, "Không tìm thấy danh mục"));

        if (category.getUserId() == null || !category.getUserId().equals(userId)) {
            throw new org.piggy.common.exception.CustomException(org.piggy.common.emums.ExceptionErrorCode.UNAUTHORIZED, "Bạn không có quyền sửa danh mục này");
        }

        if (request.getName() != null) {
            category.setName(request.getName());
        }
        if (request.getIcon() != null) {
            category.setIcon(request.getIcon());
        }
        if (request.getType() != null) {
            category.setType(request.getType());
        }

        category = categoryRepository.save(category);
        return CategoryResponse.fromEntity(category);
    }

    @Override
    public void deleteCustomCategory(String userId, Long categoryId) {
        org.piggy.transactionservice.entity.Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new org.piggy.common.exception.CustomException(org.piggy.common.emums.ExceptionErrorCode.NOT_FOUND, "Không tìm thấy danh mục"));

        if (category.getUserId() == null || !category.getUserId().equals(userId)) {
            throw new org.piggy.common.exception.CustomException(org.piggy.common.emums.ExceptionErrorCode.UNAUTHORIZED, "Bạn không có quyền xóa danh mục này");
        }

        if (transactionRepository.existsByCategoryId(categoryId)) {
            throw new org.piggy.common.exception.CustomException(org.piggy.common.emums.ExceptionErrorCode.VALIDATION_FAILED, "Không thể xóa danh mục đã có giao dịch");
        }

        categoryRepository.delete(category);
    }
}