package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class HealthBoxProductDetailResponse {
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
    private String summaryText;
    private Long salesPolicyId;
    private String salesPolicyTitle;
    private String salesPolicyText;
    private Long deliveryPolicyId;
    private String deliveryPolicyTitle;
    private String deliveryPolicyText;
    private String detailHtml;
    private Integer sortOrder;
    private Integer consumerPrice;
    private Integer memberPrice;
    private Integer supplyPrice;
    private Integer settlementBasePrice;
    private String priceExposurePolicy;
    private String thumbnailUrl;
    private String deletedYn;
    private LocalDateTime deletedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<HealthBoxProductMediaResponse> mediaItems;
    private List<HealthBoxProductOptionGroupResponse> optionGroups;
    private List<HealthBoxProductSkuResponse> skus;
}

