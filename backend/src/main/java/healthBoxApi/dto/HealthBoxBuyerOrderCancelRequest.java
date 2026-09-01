package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxBuyerOrderCancelRequest {
    private Long buyerMemberId;
    private Long dealerMallId;
    private String sessionToken;
    private String reason;
}
