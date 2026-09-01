package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxAdminOrderAddressRequest {
    private String receiverName;
    private String receiverPhone;
    private String zipCode;
    private String baseAddress;
    private String detailAddress;
}
