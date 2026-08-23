package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_BUYER_ADDRESS")
@ApiModel(description = "회원 배송지 엔티티")
public class HealthBoxBuyerAddressVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "BUYER_MEMBER_ID", nullable = false)
    private Long buyerMemberId;

    @Column(name = "ADDRESS_ALIAS", length = 80)
    private String addressAlias;

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

    @Column(name = "DEFAULT_YN", nullable = false, length = 1)
    private String defaultYn = "N";
}

