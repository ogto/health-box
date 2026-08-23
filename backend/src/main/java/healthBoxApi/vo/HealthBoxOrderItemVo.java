package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_ORDER_ITEM")
@ApiModel(description = "주문상품 엔티티")
public class HealthBoxOrderItemVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "ORDER_ID", nullable = false)
    private Long orderId;

    @Column(name = "PRODUCT_ID", nullable = false)
    private Long productId;

    @Column(name = "SKU_ID", nullable = false)
    private Long skuId;

    @Column(name = "SKU_CODE_SNAPSHOT", nullable = false, length = 100)
    private String skuCodeSnapshot;

    @Column(name = "SKU_NAME_SNAPSHOT", nullable = false, length = 255)
    private String skuNameSnapshot;

    @Column(name = "OPTION_SUMMARY_SNAPSHOT", length = 255)
    private String optionSummarySnapshot;

    @Column(name = "PRODUCT_NAME_SNAPSHOT", nullable = false, length = 255)
    private String productNameSnapshot;

    @Column(name = "PRICE_SNAPSHOT", nullable = false)
    private Integer priceSnapshot;

    @Column(name = "QUANTITY", nullable = false)
    private Integer quantity;

    @Column(name = "CANCELED_QUANTITY", nullable = false)
    private Integer canceledQuantity = 0;

    @Column(name = "LINE_AMOUNT", nullable = false)
    private Integer lineAmount;
}

