package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HealthBoxShipmentBulkDispatchRequest {
    private List<HealthBoxShipmentBulkDispatchRowRequest> rows;
}
