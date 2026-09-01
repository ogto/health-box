package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxAdminClaimStatusRequest {
    private String status;
    private String reason;
}
