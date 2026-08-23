package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HealthBoxProductSaveRequest {
    private Long id;
    private String name;
    private String productCode;
    private String slug;
    private String brandName;
    private Long categoryId;
    private String status;
    private String publishStatus;
    private String optionUseYn;
    private String summaryText;
    private Long salesPolicyId;
    private String salesPolicyText;
    private Long deliveryPolicyId;
    private String deliveryPolicyText;
    private String detailHtml;
    private Integer sortOrder;
    private Integer consumerPrice;
    private Integer memberPrice;
    private Integer supplyPrice;
    private Integer settlementBasePrice;
    private String priceExposurePolicy;
    private List<HealthBoxProductMediaRequest> mediaItems;
    private List<HealthBoxProductOptionGroupRequest> optionGroups;
    private List<HealthBoxProductSkuRequest> skus;
}

