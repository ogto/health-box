package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxOrderPaymentRequest {
    private String provider;
    private String paymentKey;
    private String paymentOrderId;
    private String method;
    private String methodDetail;
    private String paymentMethodName;
    private String approvedAt;
    private Integer paidAmount;
    private String receiptUrl;
    private String rawResponseJson;
}

