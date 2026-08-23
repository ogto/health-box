package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxBuyerAddressRequest {
    private Long dealerMallId;
    private String sessionToken;
    private String addressAlias;
    private String receiverName;
    private String receiverPhone;
    private String zipCode;
    private String baseAddress;
    private String detailAddress;
    private String defaultYn;
}

