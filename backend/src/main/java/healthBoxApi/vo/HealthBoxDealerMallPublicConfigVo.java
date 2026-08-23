package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_DEALER_MALL_PUBLIC_CONFIG")
@ApiModel(description = "딜러몰 공개 설정 엔티티")
public class HealthBoxDealerMallPublicConfigVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "DEALER_MALL_ID", nullable = false)
    private Long dealerMallId;

    @Column(name = "SLUG", nullable = false, length = 80)
    private String slug;

    @Column(name = "MALL_NAME", nullable = false, length = 150)
    private String mallName;

    @Column(name = "DISPLAY_NAME", nullable = false, length = 150)
    private String displayName;

    @Column(name = "SUPPORT_EMAIL", length = 150)
    private String supportEmail;

    @Column(name = "SUPPORT_PHONE", length = 30)
    private String supportPhone;

    @Column(name = "ACTIVE_YN", nullable = false, length = 1)
    private String activeYn = "Y";
}

