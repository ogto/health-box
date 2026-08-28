package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxBuyerSignupAvailabilityRequest {
    private Long dealerMallId;
    private String slug;
    private Boolean hqMall;
    private String type;
    private String value;
}
