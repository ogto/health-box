package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxProductSkuStockUpdateRequest {
    private Integer stockQuantity;
    private Integer safetyStock;
    private String soldOutYn;
    private String status;
}

