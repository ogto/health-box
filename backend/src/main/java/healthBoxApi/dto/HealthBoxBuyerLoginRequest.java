package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxBuyerLoginRequest {

    private Long dealerMallId;

    private String slug;

    private String host;

    private Boolean hqMall;

    private String loginId;

    private String password;
}

