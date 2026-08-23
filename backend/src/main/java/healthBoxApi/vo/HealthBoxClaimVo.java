package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_CLAIM")
@ApiModel(description = "반품/취소 엔티티")
public class HealthBoxClaimVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "ORDER_ID", nullable = false)
    private Long orderId;

    @Column(name = "DEALER_MALL_ID", nullable = false)
    private Long dealerMallId;

    @Column(name = "BUYER_MEMBER_ID", nullable = false)
    private Long buyerMemberId;

    @Column(name = "CLAIM_TYPE", nullable = false, length = 30)
    private String claimType;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status;

    @Column(name = "AMOUNT", nullable = false)
    private Integer amount;

    @Column(name = "REASON", length = 500)
    private String reason;

    @Column(name = "PROCESSED_AT")
    private LocalDateTime processedAt;
}

