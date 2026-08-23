package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HealthBoxOrderCreateRequest {
    private Long buyerMemberId;
    private Long dealerMallId;
    private String sessionToken;
    private Long buyerAddressId;
    private String ordererName;
    private String ordererPhone;
    private String receiverName;
    private String receiverPhone;
    private String zipCode;
    private String baseAddress;
    private String detailAddress;
    private String paymentStatus;
    private String orderStatus;
    private Integer productAmount;
    private Integer shippingFee;
    private Integer discountAmount;
    private Integer totalPaymentAmount;
    private HealthBoxOrderPaymentRequest payment;
    private List<HealthBoxOrderCreateItemRequest> items;
}

