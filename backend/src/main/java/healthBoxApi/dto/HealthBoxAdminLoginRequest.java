package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxAdminLoginRequest {
    private String loginId;
    private String password;
}
