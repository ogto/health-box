package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxNoticeSaveRequest {
    private Long id;
    private String title;
    private String slug;
    private String body;
    private String category;
    private String status;
    private Boolean pinned;
    private Long authorAccountId;
}

