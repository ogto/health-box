package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxOrderCreateItemRequest {
    private Long skuId;
    private Integer quantity;
    private String optionSummarySnapshot;
}

