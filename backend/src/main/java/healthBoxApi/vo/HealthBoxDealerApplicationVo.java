package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_DEALER_APPLICATION")
@ApiModel(description = "딜러 신청 엔티티")
public class HealthBoxDealerApplicationVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "APPLICANT_NAME", nullable = false, length = 100)
    private String applicantName;

    @Column(name = "PHONE", nullable = false, length = 30)
    private String phone;

    @Column(name = "EMAIL", length = 150)
    private String email;

    @Column(name = "BUSINESS_INFO", length = 1000)
    private String businessInfo;

    @Column(name = "WANTED_MALL_NAME", nullable = false, length = 150)
    private String wantedMallName;

    @Column(name = "WANTED_SLUG", nullable = false, length = 80)
    private String wantedSlug;

    @Column(name = "DEALER_MALL_ID")
    private Long dealerMallId;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "PENDING";

    @Column(name = "APPROVED_AT")
    private LocalDateTime approvedAt;

    @Column(name = "REJECT_REASON", length = 500)
    private String rejectReason;

    @Column(name = "REVIEW_MEMO", length = 1000)
    private String reviewMemo;
}

