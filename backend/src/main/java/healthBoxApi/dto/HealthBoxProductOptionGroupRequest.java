package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HealthBoxProductOptionGroupRequest {
    private String groupName;
    private Integer sortOrder;
    private String requiredYn;
    private List<HealthBoxProductOptionValueRequest> values;
}

