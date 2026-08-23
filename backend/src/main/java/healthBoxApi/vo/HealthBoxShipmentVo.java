package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_SHIPMENT")
@ApiModel(description = "배송 엔티티")
public class HealthBoxShipmentVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "ORDER_ID", nullable = false)
    private Long orderId;

    @Column(name = "SHIPMENT_STATUS", nullable = false, length = 30)
    private String shipmentStatus;

    @Column(name = "COURIER_COMPANY", length = 100)
    private String courierCompany;

    @Column(name = "TRACKING_NO", length = 100)
    private String trackingNo;

    @Column(name = "SHIPPED_AT")
    private LocalDateTime shippedAt;

    @Column(name = "DELIVERED_AT")
    private LocalDateTime deliveredAt;

    @Column(name = "HANDLER_ACCOUNT_ID")
    private Long handlerAccountId;
}

