package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(
    name = "HEALTH_BOX_PAYMENT",
    uniqueConstraints = {
        @UniqueConstraint(name = "UK_HEALTH_BOX_PAYMENT_KEY", columnNames = "PAYMENT_KEY"),
        @UniqueConstraint(name = "UK_HEALTH_BOX_PAYMENT_ORDER_ID", columnNames = "PAYMENT_ORDER_ID")
    }
)
@ApiModel(description = "건강박스 결제 내역 엔티티")
public class HealthBoxPaymentVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "ORDER_ID", nullable = false)
    private Long orderId;

    @Column(name = "BUYER_MEMBER_ID", nullable = false)
    private Long buyerMemberId;

    @Column(name = "DEALER_MALL_ID", nullable = false)
    private Long dealerMallId;

    @Column(name = "PROVIDER", nullable = false, length = 50)
    private String provider;

    @Column(name = "PAYMENT_KEY", length = 200)
    private String paymentKey;

    @Column(name = "PAYMENT_ORDER_ID", length = 120)
    private String paymentOrderId;

    @Column(name = "ORDER_NO", nullable = false, length = 100)
    private String orderNo;

    @Column(name = "METHOD", length = 80)
    private String method;

    @Column(name = "METHOD_DETAIL", length = 120)
    private String methodDetail;

    @Column(name = "PAYMENT_METHOD_NAME", length = 120)
    private String paymentMethodName;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status;

    @Column(name = "APPROVED_AT")
    private LocalDateTime approvedAt;

    @Column(name = "PAID_AMOUNT", nullable = false)
    private Integer paidAmount;

    @Column(name = "CANCELED_AMOUNT", nullable = false)
    private Integer canceledAmount;

    @Column(name = "REMAINING_AMOUNT", nullable = false)
    private Integer remainingAmount;

    @Column(name = "RECEIPT_URL", length = 500)
    private String receiptUrl;

    @Lob
    @Column(name = "RAW_RESPONSE_JSON")
    private String rawResponseJson;
}

