package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(
    name = "HEALTH_BOX_PAYMENT_CANCEL_REQUEST",
    uniqueConstraints = @UniqueConstraint(
        name = "UK_HEALTH_BOX_PAYMENT_CANCEL_REQUEST_ID",
        columnNames = "REQUEST_ID"
    )
)
@ApiModel(description = "건강박스 결제 취소 멱등 요청")
public class HealthBoxPaymentCancelRequestVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "REQUEST_ID", nullable = false, length = 100, unique = true)
    private String requestId;

    @Column(name = "ORDER_ID", nullable = false)
    private Long orderId;

    @Column(name = "CANCEL_AMOUNT", nullable = false)
    private Integer cancelAmount;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status;
}

