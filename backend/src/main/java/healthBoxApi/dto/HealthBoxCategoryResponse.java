package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class HealthBoxCategoryResponse {
    private Long id;
    private String name;
    private String slug;
    private String categoryCode;
    private Integer sortOrder;
    private String status;
    private String deletedYn;
    private LocalDateTime deletedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

