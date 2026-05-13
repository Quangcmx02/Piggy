package org.piggy.transactionservice.dtos.request;

import lombok.Data;
import org.piggy.transactionservice.constant.TransactionType;

@Data
public class CategoryRequest {
    private String name;
    private String icon;
    private TransactionType type; // INCOME hoặc EXPENSE
}