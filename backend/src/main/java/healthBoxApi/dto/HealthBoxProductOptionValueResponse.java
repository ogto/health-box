package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxProductOptionValueResponse {
    private Long id;
    private String valueName;
    private String valueCode;
    private Integer sortOrder;
    private String status;
}

