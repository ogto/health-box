package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class HealthBoxOrderDetailResponse {
    private Long id;
    private String orderNo;
    private Long buyerMemberId;
    private Long dealerMallId;
    private String dealerSlugSnapshot;
    private String dealerNameSnapshot;
    private String ordererName;
    private String ordererPhone;
    private String receiverName;
    private String receiverPhone;
    private String zipCode;
    private String baseAddress;
    private String detailAddress;
    private Integer productAmount;
    private Integer shippingFee;
    private Integer discountAmount;
    private Integer totalPaymentAmount;
    private Integer remainingPaymentAmount;
    private Integer canceledPaymentAmount;
    private String paymentStatus;
    private String paymentMethodName;
    private String paymentProvider;
    private String paymentKey;
    private String paymentOrderId;
    private String receiptUrl;
    private String orderStatus;
    private LocalDateTime orderedAt;
    private Long shipmentId;
    private String shipmentStatus;
    private String courierCompany;
    private String trackingNo;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private String claimType;
    private String claimStatus;
    private String claimReason;
    private LocalDateTime claimRequestedAt;
    private List<HealthBoxClaimResponse> claims;
    private List<HealthBoxOrderItemResponse> items;
    private HealthBoxOrderPaymentResponse payment;
}

