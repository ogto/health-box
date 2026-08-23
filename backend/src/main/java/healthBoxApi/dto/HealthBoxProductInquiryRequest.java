package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxProductInquiryRequest {
    private Long productId;
    private Long buyerMemberId;
    private Long dealerMallId;
    private String sessionToken;
    private String question;
    private String privateYn;
}

