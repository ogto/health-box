package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxOrderCancellationResponse {
    private String action;
    private String message;
    private HealthBoxOrderDetailResponse order;
}
