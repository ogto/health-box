package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxProductOptionValueRequest {
    private String valueName;
    private String valueCode;
    private Integer sortOrder;
    private String status;
}

