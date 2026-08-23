package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HealthBoxOrderPartialCancelRequest {
    private String requestId;
    private List<HealthBoxOrderCancelItemRequest> items;
}

