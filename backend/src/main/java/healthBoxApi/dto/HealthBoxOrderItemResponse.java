package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxOrderItemResponse {
    private Long id;
    private Long productId;
    private Long skuId;
    private String productNameSnapshot;
    private String skuCodeSnapshot;
    private String skuNameSnapshot;
    private String optionSummarySnapshot;
    private String thumbnailUrl;
    private Integer priceSnapshot;
    private Integer quantity;
    private Integer canceledQuantity;
    private Integer remainingQuantity;
    private Integer lineAmount;
}

