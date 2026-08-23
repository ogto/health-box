package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(
    name = "HEALTH_BOX_DEALER_MALL",
    uniqueConstraints = {
        @UniqueConstraint(name = "UK_HEALTH_BOX_DEALER_MALL_SLUG", columnNames = {"SLUG"}),
        @UniqueConstraint(name = "UK_HEALTH_BOX_DEALER_MALL_CODE", columnNames = {"DEALER_CODE"})
    }
)
@ApiModel(description = "딜러몰 엔티티")
public class HealthBoxDealerMallVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "HQ_ID", nullable = false)
    @ApiModelProperty(value = "본사 연결값")
    private Long hqId;

    @Column(name = "MALL_NAME", nullable = false, length = 150)
    @ApiModelProperty(value = "딜러몰명")
    private String mallName;

    @Column(name = "DISPLAY_NAME", nullable = false, length = 150)
    @ApiModelProperty(value = "딜러 표시명")
    private String displayName;

    @Column(name = "SLUG", nullable = false, length = 80)
    @ApiModelProperty(value = "서브도메인 slug")
    private String slug;

    @Column(name = "DEALER_CODE", nullable = false, length = 80)
    @ApiModelProperty(value = "고유 딜러 코드")
    private String dealerCode;

    @Column(name = "STATUS", nullable = false, length = 30)
    @ApiModelProperty(value = "상태")
    private String status = "PENDING";

    @Column(name = "APPROVED_AT")
    @ApiModelProperty(value = "승인일시")
    private LocalDateTime approvedAt;

    @Column(name = "JOINED_AT")
    @ApiModelProperty(value = "가입일시")
    private LocalDateTime joinedAt;

    @Column(name = "REPRESENTATIVE_PHONE", length = 30)
    private String representativePhone;

    @Column(name = "SUPPORT_EMAIL", length = 150)
    private String supportEmail;

    @Column(name = "SUPPORT_PHONE", length = 30)
    private String supportPhone;
}

