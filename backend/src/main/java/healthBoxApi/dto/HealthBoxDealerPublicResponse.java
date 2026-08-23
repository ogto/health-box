package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxDealerPublicResponse {
    private Long dealerMallId;
    private String slug;
    private String mallName;
    private String displayName;
    private String supportEmail;
    private String supportPhone;
}

