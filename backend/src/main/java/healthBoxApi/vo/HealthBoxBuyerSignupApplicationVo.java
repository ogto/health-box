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
@Table(name = "HEALTH_BOX_BUYER_SIGNUP_APPLICATION")
@ApiModel(description = "구매 회원 가입 신청 엔티티")
public class HealthBoxBuyerSignupApplicationVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "DEALER_MALL_ID", nullable = false)
    private Long dealerMallId;

    @Column(name = "NAME", nullable = false, length = 100)
    private String name;

    @Column(name = "PHONE", nullable = false, length = 30)
    private String phone;

    @Column(name = "EMAIL", length = 150)
    private String email;

    @Column(name = "PASSWORD_HASH", length = 255)
    private String passwordHash;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "PENDING";

    @Column(name = "APPLIED_AT")
    private LocalDateTime appliedAt;

    @Column(name = "APPROVED_AT")
    private LocalDateTime approvedAt;

    @Column(name = "BUYER_MEMBER_ID")
    private Long buyerMemberId;

    @Column(name = "REJECT_REASON", length = 500)
    private String rejectReason;

    @Column(name = "INBOUND_CHANNEL", length = 50)
    private String inboundChannel;

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

