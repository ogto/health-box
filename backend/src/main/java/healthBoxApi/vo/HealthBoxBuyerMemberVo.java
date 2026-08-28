package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_BUYER_MEMBER")
@ApiModel(description = "승인된 구매 회원 엔티티")
public class HealthBoxBuyerMemberVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "DEALER_MALL_ID", nullable = false)
    private Long dealerMallId;

    @Column(name = "ACCOUNT_ID")
    private Long accountId;

    @Column(name = "NAME", nullable = false, length = 100)
    private String name;

    @Column(name = "PHONE", nullable = false, length = 30)
    private String phone;

    @Column(name = "EMAIL", length = 150)
    private String email;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "JOINED_AT")
    private LocalDateTime joinedAt;

    @Column(name = "APPROVED_AT")
    private LocalDateTime approvedAt;

    @Column(name = "BIRTH_DATE")
    private LocalDate birthDate;

    @Column(name = "TERMS_AGREED_AT")
    private LocalDateTime termsAgreedAt;

    @Column(name = "PRIVACY_AGREED_AT")
    private LocalDateTime privacyAgreedAt;

    @Column(name = "THIRD_PARTY_AGREED_AT")
    private LocalDateTime thirdPartyAgreedAt;

    @Column(name = "MARKETING_CONSENT_YN", nullable = false, length = 1)
    private String marketingConsentYn = "N";

    @Column(name = "MARKETING_CONSENT_UPDATED_AT")
    private LocalDateTime marketingConsentUpdatedAt;

    @Column(name = "CONSENT_DOCUMENT_VERSION", length = 20)
    private String consentDocumentVersion;
}

