package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxBuyerSignupCreateRequest {

    private Long dealerMallId;

    private String slug;

    private String name;

    private String phone;

    private String email;

    private String password;

    private String inboundChannel;
}

