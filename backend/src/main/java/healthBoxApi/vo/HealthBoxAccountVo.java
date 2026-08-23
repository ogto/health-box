package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_ACCOUNT")
@ApiModel(description = "공통 계정 엔티티")
public class HealthBoxAccountVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NAME", nullable = false, length = 100)
    private String name;

    @Column(name = "PHONE", nullable = false, length = 30)
    private String phone;

    @Column(name = "EMAIL", length = 150)
    private String email;

    @Column(name = "PASSWORD_HASH", length = 255)
    private String passwordHash;

    @Column(name = "AUTH_IDENTIFIER", length = 255)
    private String authIdentifier;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "LAST_LOGIN_AT")
    private LocalDateTime lastLoginAt;

    @Column(name = "SESSION_TOKEN", length = 255)
    private String sessionToken;

    @Column(name = "SESSION_EXPIRED_AT")
    private LocalDateTime sessionExpiredAt;
}

