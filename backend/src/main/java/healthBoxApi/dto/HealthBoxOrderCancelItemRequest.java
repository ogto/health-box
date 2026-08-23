package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxOrderCancelItemRequest {
    private Long orderItemId;
    private Integer quantity;
}

