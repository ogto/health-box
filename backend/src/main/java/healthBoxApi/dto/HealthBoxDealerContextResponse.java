package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxDealerContextResponse {
    private boolean valid;
    private String reason;
    private String appType;
    private String host;
    private String slug;
    private Long dealerMallId;
    private String mallName;
    private String displayName;
    private String supportEmail;
    private String supportPhone;
}

