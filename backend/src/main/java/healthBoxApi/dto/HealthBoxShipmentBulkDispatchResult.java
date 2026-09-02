package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxShipmentBulkDispatchResult {
    private String orderNo;
    private boolean success;
    private String message;
}
