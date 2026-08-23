package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_PRODUCT_SKU_OPTION")
@ApiModel(description = "건강창고 상품 SKU 옵션 매핑 엔티티")
public class HealthBoxProductSkuOptionVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "SKU_ID", nullable = false)
    private Long skuId;

    @Column(name = "OPTION_GROUP_ID", nullable = false)
    private Long optionGroupId;

    @Column(name = "OPTION_VALUE_ID", nullable = false)
    private Long optionValueId;
}

