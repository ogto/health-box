package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxCartItemResponse {
    private Long id;
    private Long buyerMemberId;
    private Long dealerMallId;
    private Long skuId;
    private Integer quantity;
    private Long productId;
    private String productSlug;
    private String productTitle;
    private String skuCode;
    private String skuName;
    private String optionSummary;
    private Integer unitPrice;
    private Integer lineAmount;
    private String thumbnailUrl;
}

