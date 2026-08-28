package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

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

    private LocalDate birthDate;

    private Boolean termsAgreed;

    private Boolean privacyAgreed;

    private Boolean thirdPartyAgreed;

    private Boolean marketingAgreed;

    private String consentDocumentVersion;
}

