package healthBoxApi.vo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_ADMIN_STAFF")
@ApiModel(description = "건강창고 관리자 직원 계정")
public class HealthBoxAdminStaffVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "SCOPE_TYPE", nullable = false, length = 20)
    private String scopeType = "HQ";

    @Column(name = "DEALER_MALL_ID")
    private Long dealerMallId;

    @Column(name = "ACCOUNT_ID")
    private Long accountId;

    @Column(name = "NAME", nullable = false, length = 100)
    private String name;

    @Column(name = "LOGIN_ID", nullable = false, length = 80)
    private String loginId;

    @JsonIgnore
    @Column(name = "PASSWORD_HASH", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "PHONE", nullable = false, length = 30)
    private String phone;

    @Column(name = "EMAIL", length = 150)
    private String email;

    @Column(name = "POSITION_NAME", length = 80)
    private String positionName;

    @Column(name = "ROLE_TYPE", nullable = false, length = 20)
    private String roleType = "STAFF";

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "JOINED_AT")
    private LocalDateTime joinedAt;

    @Column(name = "LAST_LOGIN_AT")
    private LocalDateTime lastLoginAt;

    @Column(name = "MEMO", length = 1000)
    private String memo;
}
