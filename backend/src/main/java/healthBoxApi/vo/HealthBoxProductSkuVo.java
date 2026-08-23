package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_PRODUCT_SKU")
@ApiModel(description = "건강창고 상품 SKU 엔티티")
public class HealthBoxProductSkuVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "PRODUCT_ID", nullable = false)
    private Long productId;

    @Column(name = "SKU_CODE", nullable = false, length = 100, unique = true)
    private String skuCode;

    @Column(name = "SKU_NAME", nullable = false, length = 200)
    private String skuName;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "CONSUMER_PRICE")
    private Integer consumerPrice;

    @Column(name = "MEMBER_PRICE")
    private Integer memberPrice;

    @Column(name = "SUPPLY_PRICE")
    private Integer supplyPrice;

    @Column(name = "SETTLEMENT_BASE_PRICE")
    private Integer settlementBasePrice;

    @Column(name = "STOCK_QUANTITY")
    private Integer stockQuantity;

    @Column(name = "SAFETY_STOCK")
    private Integer safetyStock;

    @Column(name = "SOLD_OUT_YN", nullable = false, length = 1)
    private String soldOutYn = "N";

    @Column(name = "DELETED_YN", nullable = false, length = 1)
    private String deletedYn = "N";

    @Column(name = "DELETED_AT")
    private LocalDateTime deletedAt;
}

