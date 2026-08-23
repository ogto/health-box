package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_PRODUCT_OPTION_VALUE")
@ApiModel(description = "건강창고 상품 옵션 값 엔티티")
public class HealthBoxProductOptionValueVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "PRODUCT_ID", nullable = false)
    private Long productId;

    @Column(name = "OPTION_GROUP_ID", nullable = false)
    private Long optionGroupId;

    @Column(name = "VALUE_NAME", nullable = false, length = 100)
    private String valueName;

    @Column(name = "VALUE_CODE", nullable = false, length = 50)
    private String valueCode;

    @Column(name = "SORT_ORDER")
    private Integer sortOrder;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "ACTIVE";
}

