package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxAdminClaimRequest {
    private String claimType;
    private String reason;
}
