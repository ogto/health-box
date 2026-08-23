package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HealthBoxProductSkuResponse {
    private Long id;
    private String skuCode;
    private String skuName;
    private String status;
    private Integer consumerPrice;
    private Integer memberPrice;
    private Integer supplyPrice;
    private Integer settlementBasePrice;
    private Integer stockQuantity;
    private Integer safetyStock;
    private String soldOutYn;
    private List<String> optionValueCodes;
}

