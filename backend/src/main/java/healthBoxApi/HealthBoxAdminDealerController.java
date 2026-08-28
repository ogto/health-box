package healthBoxApi;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import healthBoxApi.dto.HealthBoxAdminDealerCreateRequest;
import healthBoxApi.dto.HealthBoxApprovalRequest;
import healthBoxApi.dto.HealthBoxRejectRequest;
import healthBoxApi.vo.HealthBoxDealerApplicationVo;
import healthBoxApi.vo.HealthBoxDealerMallPublicConfigVo;
import healthBoxApi.vo.HealthBoxDealerMallVo;
import healthBoxApi.vo.HealthBoxMonthlySalesSummaryVo;
import healthBoxApi.vo.HealthBoxMonthlySettlementSummaryVo;
import healthBoxApi.payload.ApiResponse;
import healthBoxApi.config.HealthBoxAdminAccessContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Api(tags = "건강창고 관리자 API > 딜러")
@RequestMapping("/health-box/admin")
public class HealthBoxAdminDealerController {

    private final HealthBoxService service;
    private final HealthBoxAdminAccessContext accessContext;

    public HealthBoxAdminDealerController(HealthBoxService service, HealthBoxAdminAccessContext accessContext) {
        this.service = service;
        this.accessContext = accessContext;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse handleInvalidDealerAdminRequest(IllegalArgumentException error) {
        return new ApiResponse(false, error.getMessage());
    }

    @ApiOperation(value = "딜러 신청 승인", notes = "딜러 신청을 승인한다.")
    @PostMapping("/dealer-applications/{applicationId}/approve")
    public ResponseEntity<ApiResponse> approveDealerApplication(
        @PathVariable Long applicationId,
        @RequestBody(required = false) HealthBoxApprovalRequest request
    ) {
        accessContext.requireHq();
        accessContext.requirePermission("DEALER_MANAGE");
        return new ResponseEntity<>(
            new ApiResponse(true, "approved", service.approveDealerApplication(applicationId, request)),
            HttpStatus.OK
        );
    }

    @ApiOperation(value = "딜러 수동 등록", notes = "관리자가 신청서 없이 딜러몰을 직접 생성한다.")
    @PostMapping("/dealer-malls/manual")
    public ResponseEntity<ApiResponse> createDealerMallManually(@RequestBody HealthBoxAdminDealerCreateRequest request) {
        accessContext.requireHq();
        accessContext.requirePermission("DEALER_MANAGE");
        return new ResponseEntity<>(
            new ApiResponse(true, "created", service.createDealerMallManually(request)),
            HttpStatus.OK
        );
    }

    @ApiOperation(value = "딜러 신청 반려", notes = "딜러 신청을 반려한다.")
    @PostMapping("/dealer-applications/{applicationId}/reject")
    public ResponseEntity<ApiResponse> rejectDealerApplication(
        @PathVariable Long applicationId,
        @RequestBody HealthBoxRejectRequest request
    ) {
        accessContext.requireHq();
        accessContext.requirePermission("DEALER_MANAGE");
        return new ResponseEntity<>(
            new ApiResponse(true, "rejected", service.rejectDealerApplication(applicationId, request)),
            HttpStatus.OK
        );
    }

    @ApiOperation(value = "딜러몰 공개 설정 조회", notes = "특정 딜러몰의 공개 설정을 조회한다.")
    @GetMapping("/dealer-malls/{dealerMallId}/public-config")
    public HealthBoxDealerMallPublicConfigVo getDealerMallPublicConfigByDealerMallId(@PathVariable Long dealerMallId) {
        accessContext.requirePermission("STOREFRONT_MANAGE");
        accessContext.requireDealerMallAccess(dealerMallId);
        return service.getDealerMallPublicConfigByDealerMallId(dealerMallId);
    }

    @ApiOperation(value = "딜러몰 공개 설정 저장", notes = "특정 딜러몰의 공개 설정을 저장한다.")
    @PutMapping("/dealer-malls/{dealerMallId}/public-config")
    public HealthBoxDealerMallPublicConfigVo saveDealerMallPublicConfig(
        @PathVariable Long dealerMallId,
        @RequestBody HealthBoxDealerMallPublicConfigVo vo
    ) {
        accessContext.requirePermission("STOREFRONT_MANAGE");
        accessContext.requireDealerMallAccess(dealerMallId);
        return service.saveDealerMallPublicConfig(dealerMallId, vo);
    }

    @ApiOperation(value = "딜러몰 목록 조회", notes = "전체 딜러몰 목록을 조회한다.")
    @GetMapping("/dealer-malls")
    public List<HealthBoxDealerMallVo> getDealerMalls() {
        if (accessContext.isDealer()) {
            return java.util.Collections.singletonList(service.getDealerMall(accessContext.getDealerMallId()));
        }
        accessContext.requireAnyPermission(
            "DEALER_VIEW",
            "ORDER_VIEW",
            "MEMBER_VIEW",
            "SALES_VIEW",
            "STAFF_MANAGE",
            "STOREFRONT_MANAGE"
        );
        return service.getDealerMalls();
    }

    @ApiOperation(value = "딜러 신청 목록 조회", notes = "딜러 신청 목록을 조회한다.")
    @GetMapping("/dealer-applications")
    public List<HealthBoxDealerApplicationVo> getDealerApplications() {
        accessContext.requireHq();
        accessContext.requirePermission("DEALER_VIEW");
        return service.getDealerApplications();
    }

    @ApiOperation(value = "딜러몰 월 매출 집계 조회", notes = "딜러몰 기준 월 매출 집계를 조회한다.")
    @GetMapping("/dealer-malls/{dealerMallId}/monthly-sales")
    public List<HealthBoxMonthlySalesSummaryVo> getMonthlySalesSummaries(@PathVariable Long dealerMallId) {
        accessContext.requirePermission("SALES_VIEW");
        accessContext.requireDealerMallAccess(dealerMallId);
        return service.getMonthlySalesSummaries(dealerMallId);
    }

    @ApiOperation(value = "딜러몰 월 정산 집계 조회", notes = "딜러몰 기준 월 정산 집계를 조회한다.")
    @GetMapping("/dealer-malls/{dealerMallId}/monthly-settlements")
    public List<HealthBoxMonthlySettlementSummaryVo> getMonthlySettlementSummaries(@PathVariable Long dealerMallId) {
        accessContext.requirePermission("SALES_VIEW");
        accessContext.requireDealerMallAccess(dealerMallId);
        return service.getMonthlySettlementSummaries(dealerMallId);
    }
}

