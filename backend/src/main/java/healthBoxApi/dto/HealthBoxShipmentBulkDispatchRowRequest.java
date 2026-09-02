package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxShipmentBulkDispatchRowRequest {
    private String orderNo;
    private String courierCompany;
    private String trackingNo;
}
