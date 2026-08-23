package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(
    name = "HEALTH_BOX_BUYER_CART_ITEM",
    indexes = {
        @Index(name = "IDX_HEALTH_BOX_BUYER_CART_MEMBER", columnList = "BUYER_MEMBER_ID,DEALER_MALL_ID")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "UK_HEALTH_BOX_BUYER_CART_SKU", columnNames = {"BUYER_MEMBER_ID", "DEALER_MALL_ID", "SKU_ID"})
    }
)
@ApiModel(description = "건강창고 구매 회원 장바구니 엔티티")
public class HealthBoxBuyerCartItemVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "BUYER_MEMBER_ID", nullable = false)
    private Long buyerMemberId;

    @Column(name = "DEALER_MALL_ID", nullable = false)
    private Long dealerMallId;

    @Column(name = "SKU_ID", nullable = false)
    private Long skuId;

    @Column(name = "QUANTITY", nullable = false)
    private Integer quantity;
}

