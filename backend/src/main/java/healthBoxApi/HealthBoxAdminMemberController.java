package healthBoxApi;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import healthBoxApi.dto.HealthBoxApprovalRequest;
import healthBoxApi.dto.HealthBoxRejectRequest;
import healthBoxApi.vo.HealthBoxBuyerMemberVo;
import healthBoxApi.vo.HealthBoxBuyerSignupApplicationVo;
import healthBoxApi.payload.ApiResponse;
import healthBoxApi.config.HealthBoxAdminAccessContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Api(tags = "건강창고 관리자 API > 회원")
@RequestMapping("/health-box/admin")
public class HealthBoxAdminMemberController {

    private final HealthBoxService service;
    private final HealthBoxAdminAccessContext accessContext;

    public HealthBoxAdminMemberController(HealthBoxService service, HealthBoxAdminAccessContext accessContext) {
        this.service = service;
        this.accessContext = accessContext;
    }

    @ApiOperation(value = "구매 회원 가입 신청 승인", notes = "구매 회원 가입 신청을 승인한다.")
    @PostMapping("/buyer-signup-applications/{applicationId}/approve")
    public ResponseEntity<ApiResponse> approveBuyerSignupApplication(
        @PathVariable Long applicationId,
        @RequestBody(required = false) HealthBoxApprovalRequest request
    ) {
        accessContext.requirePermission("MEMBER_MANAGE");
        accessContext.requireDealerMallAccess(service.getBuyerSignupApplication(applicationId).getDealerMallId());
        return new ResponseEntity<>(
            new ApiResponse(true, "approved", service.approveBuyerSignupApplication(applicationId, request)),
            HttpStatus.OK
        );
    }

    @ApiOperation(value = "구매 회원 가입 신청 반려", notes = "구매 회원 가입 신청을 반려한다.")
    @PostMapping("/buyer-signup-applications/{applicationId}/reject")
    public ResponseEntity<ApiResponse> rejectBuyerSignupApplication(
        @PathVariable Long applicationId,
        @RequestBody HealthBoxRejectRequest request
    ) {
        accessContext.requirePermission("MEMBER_MANAGE");
        accessContext.requireDealerMallAccess(service.getBuyerSignupApplication(applicationId).getDealerMallId());
        return new ResponseEntity<>(
            new ApiResponse(true, "rejected", service.rejectBuyerSignupApplication(applicationId, request)),
            HttpStatus.OK
        );
    }

    @ApiOperation(value = "딜러몰별 회원 목록 조회", notes = "특정 딜러몰 소속 구매 회원 목록을 조회한다.")
    @GetMapping("/dealer-malls/{dealerMallId}/members")
    public List<HealthBoxBuyerMemberVo> getBuyerMembersByDealerMall(@PathVariable Long dealerMallId) {
        accessContext.requirePermission("MEMBER_VIEW");
        accessContext.requireDealerMallAccess(dealerMallId);
        return service.getBuyerMembersByDealerMall(dealerMallId);
    }

    @ApiOperation(value = "구매 회원 가입 신청 목록 조회", notes = "구매 회원 가입 신청 목록을 조회한다.")
    @GetMapping("/buyer-signup-applications")
    public List<HealthBoxBuyerSignupApplicationVo> getBuyerSignupApplications() {
        accessContext.requirePermission("MEMBER_VIEW");
        return accessContext.isDealer()
            ? service.getBuyerSignupApplicationsByDealerMall(accessContext.getDealerMallId())
            : service.getBuyerSignupApplications();
    }

    @ApiOperation(value = "전체 구매 회원 목록 조회", notes = "전체 구매 회원 목록을 조회한다.")
    @GetMapping("/members")
    public List<HealthBoxBuyerMemberVo> getBuyerMembers() {
        accessContext.requirePermission("MEMBER_VIEW");
        return accessContext.isDealer()
            ? service.getBuyerMembersByDealerMall(accessContext.getDealerMallId())
            : service.getBuyerMembers();
    }
}

