package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_ACCOUNT_ROLE")
@ApiModel(description = "계정 권한 연결 엔티티")
public class HealthBoxAccountRoleVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "ACCOUNT_ID", nullable = false)
    private Long accountId;

    @Column(name = "ROLE", nullable = false, length = 30)
    private String role;

    @Column(name = "HQ_ID")
    private Long hqId;

    @Column(name = "DEALER_MALL_ID")
    private Long dealerMallId;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "ACTIVE";
}

