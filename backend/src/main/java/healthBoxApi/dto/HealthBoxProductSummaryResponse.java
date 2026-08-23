package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class HealthBoxProductSummaryResponse {
    private Long id;
    private String name;
    private String productCode;
    private String slug;
    private String brandName;
    private Long categoryId;
    private String categoryName;
    private String categoryCode;
    private String status;
    private String publishStatus;
    private String optionUseYn;
    private Integer consumerPrice;
    private Integer memberPrice;
    private Integer sortOrder;
    private String thumbnailUrl;
    private Integer totalStockQuantity;
    private String deletedYn;
    private LocalDateTime deletedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

