package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_SHIPMENT_ITEM")
@ApiModel(description = "배송상품 엔티티")
public class HealthBoxShipmentItemVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "SHIPMENT_ID", nullable = false)
    private Long shipmentId;

    @Column(name = "ORDER_ITEM_ID", nullable = false)
    private Long orderItemId;

    @Column(name = "QUANTITY", nullable = false)
    private Integer quantity;
}

