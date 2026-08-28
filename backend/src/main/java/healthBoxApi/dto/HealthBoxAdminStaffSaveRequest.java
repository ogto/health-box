package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class HealthBoxAdminStaffSaveRequest {
    private Long id;
    private String scopeType;
    private Long dealerMallId;
    private String name;
    private String loginId;
    private String password;
    private String phone;
    private String email;
    private String positionName;
    private String roleType;
    private String status;
    private String memo;
    private List<String> permissionCodes;
}
