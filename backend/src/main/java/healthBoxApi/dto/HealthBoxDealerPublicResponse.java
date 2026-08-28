package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxDealerPublicResponse {
    private Long dealerMallId;
    private String slug;
    private String mallName;
    private String displayName;
    private String supportEmail;
    private String supportPhone;
    private String logoUrl;
    private String faviconUrl;
    private String mainVisualUrl;
    private String mainVisualLinkUrl;
    private String middleBannerUrl;
    private String middleBannerLinkUrl;
    private String shareThumbnailUrl;
    private String metaTitle;
    private String metaDescription;
    private String mainNavigationJson;
    private String searchPlaceholder;
    private String policyText;
    private String customerCenterText;
}

