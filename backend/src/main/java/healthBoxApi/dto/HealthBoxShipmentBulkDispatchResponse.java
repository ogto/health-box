package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HealthBoxShipmentBulkDispatchResponse {
    private int requestedCount;
    private int successCount;
    private int failureCount;
    private List<HealthBoxShipmentBulkDispatchResult> results;
}
