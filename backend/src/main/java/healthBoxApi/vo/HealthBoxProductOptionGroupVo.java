package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_PRODUCT_OPTION_GROUP")
@ApiModel(description = "건강창고 상품 옵션 그룹 엔티티")
public class HealthBoxProductOptionGroupVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "PRODUCT_ID", nullable = false)
    private Long productId;

    @Column(name = "GROUP_NAME", nullable = false, length = 100)
    private String groupName;

    @Column(name = "SORT_ORDER")
    private Integer sortOrder;

    @Column(name = "REQUIRED_YN", nullable = false, length = 1)
    private String requiredYn = "Y";
}

