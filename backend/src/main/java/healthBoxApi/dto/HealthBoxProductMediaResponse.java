package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxProductMediaResponse {
    private Long id;
    private String mediaType;
    private String mediaUrl;
    private Integer sortOrder;
    private String altText;
}

