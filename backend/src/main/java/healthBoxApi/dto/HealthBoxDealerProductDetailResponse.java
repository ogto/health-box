package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HealthBoxDealerProductDetailResponse {
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
    private String salesPolicyText;
    private String deliveryPolicyText;
    private String detailHtml;
    private String thumbnailUrl;
    private Integer totalStockQuantity;
    private Boolean soldOut;
    private List<HealthBoxProductMediaResponse> mediaItems;
    private List<HealthBoxProductOptionGroupResponse> optionGroups;
    private List<HealthBoxProductSkuResponse> skus;
}

