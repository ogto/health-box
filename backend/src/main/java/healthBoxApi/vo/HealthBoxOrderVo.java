package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_ORDER_HEADER")
@ApiModel(description = "주문 헤더 엔티티")
public class HealthBoxOrderVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "ORDER_NO", nullable = false, length = 100, unique = true)
    private String orderNo;

    @Column(name = "BUYER_MEMBER_ID", nullable = false)
    private Long buyerMemberId;

    @Column(name = "DEALER_MALL_ID", nullable = false)
    private Long dealerMallId;

    @Column(name = "DEALER_SLUG_SNAPSHOT", nullable = false, length = 80)
    private String dealerSlugSnapshot;

    @Column(name = "DEALER_NAME_SNAPSHOT", length = 150)
    private String dealerNameSnapshot;

    @Column(name = "ORDERER_NAME", nullable = false, length = 100)
    private String ordererName;

    @Column(name = "ORDERER_PHONE", nullable = false, length = 30)
    private String ordererPhone;

    @Column(name = "RECEIVER_NAME", nullable = false, length = 100)
    private String receiverName;

    @Column(name = "RECEIVER_PHONE", nullable = false, length = 30)
    private String receiverPhone;

    @Column(name = "ZIP_CODE", length = 20)
    private String zipCode;

    @Column(name = "BASE_ADDRESS", nullable = false, length = 255)
    private String baseAddress;

    @Column(name = "DETAIL_ADDRESS", length = 255)
    private String detailAddress;

    @Column(name = "PRODUCT_AMOUNT", nullable = false)
    private Integer productAmount;

    @Column(name = "SHIPPING_FEE", nullable = false)
    private Integer shippingFee;

    @Column(name = "DISCOUNT_AMOUNT", nullable = false)
    private Integer discountAmount;

    @Column(name = "TOTAL_PAYMENT_AMOUNT", nullable = false)
    private Integer totalPaymentAmount;

    @Column(name = "REMAINING_PAYMENT_AMOUNT", nullable = false)
    private Integer remainingPaymentAmount;

    @Column(name = "CANCELED_PAYMENT_AMOUNT", nullable = false)
    private Integer canceledPaymentAmount;

    @Column(name = "PAYMENT_STATUS", nullable = false, length = 30)
    private String paymentStatus;

    @Column(name = "ORDER_STATUS", nullable = false, length = 30)
    private String orderStatus;

    @Column(name = "ORDERED_AT", nullable = false)
    private LocalDateTime orderedAt;
}

