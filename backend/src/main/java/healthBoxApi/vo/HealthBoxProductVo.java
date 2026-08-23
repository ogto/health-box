package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_PRODUCT")
@ApiModel(description = "본사 공통 카탈로그 상품 엔티티")
public class HealthBoxProductVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NAME", nullable = false, length = 150)
    private String name;

    @Column(name = "PRODUCT_CODE", length = 50, unique = true)
    private String productCode;

    @Column(name = "SLUG", nullable = false, length = 150, unique = true)
    private String slug;

    @Column(name = "BRAND_NAME", length = 100)
    private String brandName;

    @Column(name = "CATEGORY_ID", nullable = false)
    private Long categoryId;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "PUBLISH_STATUS", length = 50)
    private String publishStatus;

    @Column(name = "OPTION_USE_YN", nullable = false, length = 1)
    private String optionUseYn = "N";

    @Column(name = "SUMMARY_TEXT", length = 2000)
    private String summaryText;

    @Column(name = "SALES_POLICY_ID")
    private Long salesPolicyId;

    @Lob
    @Column(name = "SALES_POLICY_TEXT", columnDefinition = "LONGTEXT")
    private String salesPolicyText;

    @Column(name = "DELIVERY_POLICY_ID")
    private Long deliveryPolicyId;

    @Column(name = "DELIVERY_POLICY_TEXT", length = 2000)
    private String deliveryPolicyText;

    @Lob
    @Column(name = "DETAIL_HTML")
    private String detailHtml;

    @Column(name = "SORT_ORDER")
    private Integer sortOrder;

    @Column(name = "CONSUMER_PRICE")
    private Integer consumerPrice;

    @Column(name = "MEMBER_PRICE")
    private Integer memberPrice;

    @Column(name = "SUPPLY_PRICE")
    private Integer supplyPrice;

    @Column(name = "SETTLEMENT_BASE_PRICE")
    private Integer settlementBasePrice;

    @Column(name = "PRICE_EXPOSURE_POLICY", length = 50)
    private String priceExposurePolicy;

    @Column(name = "DELETED_YN", nullable = false, length = 1)
    private String deletedYn = "N";

    @Column(name = "DELETED_AT")
    private LocalDateTime deletedAt;
}

