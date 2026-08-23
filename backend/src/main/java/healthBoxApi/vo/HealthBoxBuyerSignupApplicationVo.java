package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
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
}

