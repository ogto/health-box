package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxOrderQuoteResponse {
    private Integer productAmount;
    private Integer shippingFee;
    private Integer remoteAreaFee;
    private Integer discountAmount;
    private Integer totalPaymentAmount;
    private Integer freeShippingThreshold;
    private Integer remainingForFreeShipping;
}

