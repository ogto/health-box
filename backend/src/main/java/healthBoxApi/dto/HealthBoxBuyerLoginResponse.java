package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxBuyerLoginResponse {

    private Long accountId;

    private String sessionToken;

    private Long buyerMemberId;

    private Long dealerMallId;

    private String slug;

    private String mallName;

    private String displayName;

    private Boolean hqMall;

    private String name;

    private String phone;

    private String email;

    private String status;
}

