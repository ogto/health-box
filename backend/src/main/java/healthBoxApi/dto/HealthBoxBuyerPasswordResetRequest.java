package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxBuyerPasswordResetRequest {

    private Long dealerMallId;

    private String slug;

    private String host;

    private Boolean hqMall;

    private String name;

    private String phone;

    private String email;

    private String newPassword;
}

