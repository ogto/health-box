package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_BUYER_MEMBER")
@ApiModel(description = "승인된 구매 회원 엔티티")
public class HealthBoxBuyerMemberVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "DEALER_MALL_ID", nullable = false)
    private Long dealerMallId;

    @Column(name = "ACCOUNT_ID")
    private Long accountId;

    @Column(name = "NAME", nullable = false, length = 100)
    private String name;

    @Column(name = "PHONE", nullable = false, length = 30)
    private String phone;

    @Column(name = "EMAIL", length = 150)
    private String email;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "JOINED_AT")
    private LocalDateTime joinedAt;

    @Column(name = "APPROVED_AT")
    private LocalDateTime approvedAt;
}

