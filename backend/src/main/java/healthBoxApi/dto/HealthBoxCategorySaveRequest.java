package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxCategorySaveRequest {
    private Long id;
    private String name;
    private String slug;
    private String categoryCode;
    private Integer sortOrder;
    private String status;
}

