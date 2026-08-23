package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxBuyerProfileUpdateRequest {
    private Long dealerMallId;
    private String sessionToken;
    private String name;
    private String phone;
    private String email;
}

