package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_ADMIN_AUDIT_LOG")
@ApiModel(description = "관리자 활동 로그")
public class HealthBoxAdminAuditLogVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "ACTOR_STAFF_ID")
    private Long actorStaffId;

    @Column(name = "ACTOR_NAME", nullable = false, length = 120)
    private String actorName;

    @Column(name = "ACTOR_SCOPE", length = 150)
    private String actorScope;

    @Column(name = "ACTION_CODE", nullable = false, length = 80)
    private String actionCode;

    @Column(name = "ACTION_LABEL", nullable = false, length = 150)
    private String actionLabel;

    @Column(name = "TARGET_TYPE", length = 80)
    private String targetType;

    @Column(name = "TARGET_ID", length = 100)
    private String targetId;

    @Column(name = "TARGET_LABEL", length = 255)
    private String targetLabel;

    @Column(name = "DETAIL_TEXT", length = 2000)
    private String detailText;

    @Column(name = "REQUEST_METHOD", nullable = false, length = 10)
    private String requestMethod;

    @Column(name = "REQUEST_PATH", nullable = false, length = 500)
    private String requestPath;

    @Column(name = "RESULT_STATUS", nullable = false, length = 30)
    private String resultStatus;
}
