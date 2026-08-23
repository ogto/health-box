package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxDealerProductSummaryResponse {
    private Long id;
    private String name;
    private String slug;
    private String brandName;
    private Long categoryId;
    private String categoryName;
    private String categoryCode;
    private String summaryText;
    private String optionUseYn;
    private Integer consumerPrice;
    private Integer memberPrice;
    private String thumbnailUrl;
    private Integer totalStockQuantity;
    private Boolean soldOut;
}

