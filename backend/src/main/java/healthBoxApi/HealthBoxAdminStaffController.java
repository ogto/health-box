package healthBoxApi;

import healthBoxApi.dto.HealthBoxAdminStaffResponse;
import healthBoxApi.dto.HealthBoxAdminStaffSaveRequest;
import healthBoxApi.dto.HealthBoxAdminLoginRequest;
import healthBoxApi.payload.ApiResponse;
import healthBoxApi.vo.HealthBoxAdminAuditLogVo;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Api(tags = "건강창고 관리자 API > 직원/권한")
@RequestMapping("/health-box/admin")
public class HealthBoxAdminStaffController {

    private final HealthBoxAdminStaffService staffService;

    public HealthBoxAdminStaffController(HealthBoxAdminStaffService staffService) {
        this.staffService = staffService;
    }

    @ApiOperation(value = "관리자 계정 로그인", notes = "본사 또는 딜러몰 관리자 계정을 확인한다.")
    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody HealthBoxAdminLoginRequest request) {
        try {
            return ResponseEntity.ok(staffService.authenticate(request));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse(false, error.getMessage()));
        }
    }

    @ApiOperation(value = "관리자 로그인 기록", notes = "인증 완료된 관리자 로그인 이벤트를 활동 로그에 기록한다.")
    @PostMapping("/auth-events/login")
    public ResponseEntity<Void> recordLoginEvent() {
        return ResponseEntity.noContent().build();
    }

    @ApiOperation(value = "관리자 로그아웃 기록", notes = "로그인 중인 관리자 로그아웃 이벤트를 활동 로그에 기록한다.")
    @PostMapping("/auth-events/logout")
    public ResponseEntity<Void> recordLogoutEvent() {
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse handleInvalidStaffRequest(IllegalArgumentException error) {
        return new ApiResponse(false, error.getMessage());
    }

    @ApiOperation(value = "직원 목록 조회", notes = "본사와 딜러몰 소속 관리자 직원을 조회한다.")
    @GetMapping("/staff")
    public List<HealthBoxAdminStaffResponse> getStaffMembers() {
        return staffService.getStaffMembers();
    }

    @ApiOperation(value = "직원 저장", notes = "직원 계정과 소속, 역할, 권한을 저장한다.")
    @PutMapping("/staff")
    public HealthBoxAdminStaffResponse saveStaff(@RequestBody HealthBoxAdminStaffSaveRequest request) {
        return staffService.saveStaff(request);
    }

    @ApiOperation(value = "관리자 활동 로그 조회", notes = "최근 관리자 작업 이력을 조회한다.")
    @GetMapping("/audit-logs")
    public List<HealthBoxAdminAuditLogVo> getAuditLogs(
        @RequestParam(name = "limit", required = false) Integer limit
    ) {
        return staffService.getAuditLogs(limit);
    }
}
