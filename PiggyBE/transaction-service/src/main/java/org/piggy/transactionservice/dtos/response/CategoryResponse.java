package org.piggy.transactionservice.dtos.response;
import lombok.Builder;
import lombok.Data;
import org.piggy.transactionservice.constant.TransactionType;
import org.piggy.transactionservice.entity.Category;

@Data
@Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private TransactionType type;

    // Nếu userId = null, FE có thể hiển thị đây là "Danh mục hệ thống"
    private String userId;

    public static CategoryResponse fromEntity(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .userId(category.getUserId())
                .build();
    }
}