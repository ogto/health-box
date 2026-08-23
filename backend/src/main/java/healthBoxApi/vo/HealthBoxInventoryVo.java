package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_INVENTORY")
@ApiModel(description = "본사 재고 엔티티")
public class HealthBoxInventoryVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "PRODUCT_ID", nullable = false, unique = true)
    private Long productId;

    @Column(name = "QUANTITY", nullable = false)
    private Integer quantity = 0;

    @Column(name = "SAFETY_QUANTITY", nullable = false)
    private Integer safetyQuantity = 0;
}

