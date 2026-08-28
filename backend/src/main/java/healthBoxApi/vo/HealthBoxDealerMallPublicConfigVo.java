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

    @Column(name = "LOGO_URL", length = 1000)
    private String logoUrl;

    @Column(name = "FAVICON_URL", length = 1000)
    private String faviconUrl;

    @Column(name = "MAIN_VISUAL_URL", length = 1000)
    private String mainVisualUrl;

    @Column(name = "MAIN_VISUAL_LINK_URL", length = 1000)
    private String mainVisualLinkUrl;

    @Column(name = "MIDDLE_BANNER_URL", length = 1000)
    private String middleBannerUrl;

    @Column(name = "MIDDLE_BANNER_LINK_URL", length = 1000)
    private String middleBannerLinkUrl;

    @Column(name = "SHARE_THUMBNAIL_URL", length = 1000)
    private String shareThumbnailUrl;

    @Column(name = "META_TITLE", length = 255)
    private String metaTitle;

    @Column(name = "META_DESCRIPTION", length = 1000)
    private String metaDescription;

    @Column(name = "MAIN_NAVIGATION_JSON", columnDefinition = "LONGTEXT")
    private String mainNavigationJson;

    @Column(name = "SEARCH_PLACEHOLDER", length = 255)
    private String searchPlaceholder;

    @Column(name = "POLICY_TEXT", columnDefinition = "LONGTEXT")
    private String policyText;

    @Column(name = "CUSTOMER_CENTER_TEXT", columnDefinition = "LONGTEXT")
    private String customerCenterText;
}

