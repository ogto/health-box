package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxCartItemRequest {
    private Long buyerMemberId;
    private Long dealerMallId;
    private String sessionToken;
    private Long productId;
    private Long skuId;
    private Integer quantity;
}

