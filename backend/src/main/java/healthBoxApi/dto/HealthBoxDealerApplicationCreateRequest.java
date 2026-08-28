package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxDealerApplicationCreateRequest {

    private String applicantName;

    private String phone;

    private String email;

    private String businessInfo;

    private String wantedMallName;

    private String wantedSlug;

    private Boolean privacyAgreed;

    private String consentDocumentVersion;
}
