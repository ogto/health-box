package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class HealthBoxBuyerAddressResponse {
    private Long id;
    private Long buyerMemberId;
    private String addressAlias;
    private String receiverName;
    private String receiverPhone;
    private String zipCode;
    private String baseAddress;
    private String detailAddress;
    private String defaultYn;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

