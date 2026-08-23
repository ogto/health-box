package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxAdminDealerCreateRequest {

    private String applicantName;

    private String phone;

    private String email;

    private String mallName;

    private String displayName;

    private String slug;

    private String reviewMemo;
}

