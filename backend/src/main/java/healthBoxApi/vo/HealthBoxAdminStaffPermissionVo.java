package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_ADMIN_STAFF_PERMISSION")
@ApiModel(description = "관리자 직원 권한")
public class HealthBoxAdminStaffPermissionVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "STAFF_ID", nullable = false)
    private Long staffId;

    @Column(name = "PERMISSION_CODE", nullable = false, length = 80)
    private String permissionCode;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "ACTIVE";
}
