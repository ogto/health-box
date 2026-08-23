package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class HealthBoxOrderPaymentResponse {
    private Long id;
    private String provider;
    private String paymentKey;
    private String paymentOrderId;
    private String method;
    private String methodDetail;
    private String paymentMethodName;
    private String status;
    private LocalDateTime approvedAt;
    private Integer paidAmount;
    private Integer canceledAmount;
    private Integer remainingAmount;
    private String receiptUrl;
}

