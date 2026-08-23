package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class HealthBoxShipmentStatusRequest {
    private String shipmentStatus;
    private String courierCompany;
    private String trackingNo;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private Long handlerAccountId;
}

