package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class HealthBoxAdminStaffResponse {
    private Long id;
    private String scopeType;
    private Long dealerMallId;
    private String scopeName;
    private String name;
    private String loginId;
    private String phone;
    private String email;
    private String positionName;
    private String roleType;
    private String status;
    private LocalDateTime joinedAt;
    private LocalDateTime lastLoginAt;
    private String memo;
    private List<String> permissionCodes = new ArrayList<>();
}
