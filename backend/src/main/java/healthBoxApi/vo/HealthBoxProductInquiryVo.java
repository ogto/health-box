package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_PRODUCT_INQUIRY")
@ApiModel(description = "상품 문의 엔티티")
public class HealthBoxProductInquiryVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "PRODUCT_ID", nullable = false)
    private Long productId;

    @Column(name = "BUYER_MEMBER_ID", nullable = false)
    private Long buyerMemberId;

    @Column(name = "DEALER_MALL_ID", nullable = false)
    private Long dealerMallId;

    @Lob
    @Column(name = "QUESTION", nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(name = "PRIVATE_YN", nullable = false, length = 1)
    private String privateYn = "N";

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "PENDING";

    @Lob
    @Column(name = "ANSWER", columnDefinition = "TEXT")
    private String answer;

    @Column(name = "ANSWERED_AT")
    private LocalDateTime answeredAt;
}

