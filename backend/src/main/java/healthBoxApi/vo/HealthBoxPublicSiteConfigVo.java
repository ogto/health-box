package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_PUBLIC_SITE_CONFIG")
@ApiModel(description = "공통 홈페이지 설정 엔티티")
public class HealthBoxPublicSiteConfigVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "LOGO_URL", length = 255)
    private String logoUrl;

    @Column(name = "FAVICON_URL", length = 255)
    private String faviconUrl;

    @Column(name = "MAIN_VISUAL_URL", length = 255)
    private String mainVisualUrl;

    @Column(name = "MAIN_VISUAL_LINK_URL", length = 1000)
    private String mainVisualLinkUrl;

    @Column(name = "MIDDLE_BANNER_URL", length = 255)
    private String middleBannerUrl;

    @Column(name = "MIDDLE_BANNER_LINK_URL", length = 1000)
    private String middleBannerLinkUrl;

    @Column(name = "SHARE_THUMBNAIL_URL", length = 255)
    private String shareThumbnailUrl;

    @Column(name = "META_TITLE", length = 255)
    private String metaTitle;

    @Column(name = "META_DESCRIPTION", length = 1000)
    private String metaDescription;

    @Column(name = "MAIN_NAVIGATION_JSON", columnDefinition = "TEXT")
    private String mainNavigationJson;

    @Column(name = "SEARCH_PLACEHOLDER", length = 255)
    private String searchPlaceholder;

    @Lob
    @Column(name = "POLICY_TEXT", columnDefinition = "LONGTEXT")
    private String policyText;

    @Column(name = "CUSTOMER_CENTER_TEXT", length = 2000)
    private String customerCenterText;
}

