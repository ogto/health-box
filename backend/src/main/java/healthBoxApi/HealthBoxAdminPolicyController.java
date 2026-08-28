package healthBoxApi;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import healthBoxApi.vo.HealthBoxDeliveryPolicyVo;
import healthBoxApi.vo.HealthBoxSalesPolicyVo;
import healthBoxApi.payload.ApiResponse;
import healthBoxApi.config.HealthBoxAdminAccessContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Api(tags = "건강창고 관리자 API > 정책")
@RequestMapping("/health-box/admin")
public class HealthBoxAdminPolicyController {

    private final HealthBoxService service;
    private final HealthBoxAdminAccessContext accessContext;

    public HealthBoxAdminPolicyController(HealthBoxService service, HealthBoxAdminAccessContext accessContext) {
        this.service = service;
        this.accessContext = accessContext;
    }

    @ApiOperation(value = "판매정책 목록 조회", notes = "삭제되지 않은 판매정책 템플릿 목록을 조회한다.")
    @GetMapping("/sales-policies")
    public List<HealthBoxSalesPolicyVo> getSalesPolicies() {
        accessContext.requireHq();
        accessContext.requirePermission("STOREFRONT_MANAGE");
        return service.getSalesPolicies();
    }

    @ApiOperation(value = "판매정책 상세 조회", notes = "판매정책 템플릿 상세를 조회한다.")
    @GetMapping("/sales-policies/{policyId}")
    public HealthBoxSalesPolicyVo getSalesPolicy(@PathVariable Long policyId) {
        accessContext.requireHq();
        accessContext.requirePermission("STOREFRONT_MANAGE");
        return service.getSalesPolicy(policyId);
    }

    @ApiOperation(value = "판매정책 저장", notes = "판매정책 템플릿을 등록/수정한다.")
    @PutMapping("/sales-policies")
    public HealthBoxSalesPolicyVo saveSalesPolicy(@RequestBody HealthBoxSalesPolicyVo vo) {
        accessContext.requireHq();
        accessContext.requirePermission("STOREFRONT_MANAGE");
        return service.saveSalesPolicy(vo);
    }

    @ApiOperation(value = "판매정책 소프트 삭제", notes = "판매정책 템플릿을 물리 삭제하지 않고 삭제 상태로 전환한다.")
    @DeleteMapping("/sales-policies/{policyId}")
    public ResponseEntity<ApiResponse> deleteSalesPolicy(@PathVariable Long policyId) {
        accessContext.requireHq();
        accessContext.requirePermission("STOREFRONT_MANAGE");
        return new ResponseEntity<>(new ApiResponse(true, "deleted", service.deleteSalesPolicy(policyId)), HttpStatus.OK);
    }

    @ApiOperation(value = "배송정책 목록 조회", notes = "삭제되지 않은 배송정책 템플릿 목록을 조회한다.")
    @GetMapping("/delivery-policies")
    public List<HealthBoxDeliveryPolicyVo> getDeliveryPolicies() {
        accessContext.requireHq();
        accessContext.requirePermission("STOREFRONT_MANAGE");
        return service.getDeliveryPolicies();
    }

    @ApiOperation(value = "배송정책 상세 조회", notes = "배송정책 템플릿 상세를 조회한다.")
    @GetMapping("/delivery-policies/{policyId}")
    public HealthBoxDeliveryPolicyVo getDeliveryPolicy(@PathVariable Long policyId) {
        accessContext.requireHq();
        accessContext.requirePermission("STOREFRONT_MANAGE");
        return service.getDeliveryPolicy(policyId);
    }

    @ApiOperation(value = "배송정책 저장", notes = "배송정책 템플릿을 등록/수정한다.")
    @PutMapping("/delivery-policies")
    public HealthBoxDeliveryPolicyVo saveDeliveryPolicy(@RequestBody HealthBoxDeliveryPolicyVo vo) {
        accessContext.requireHq();
        accessContext.requirePermission("STOREFRONT_MANAGE");
        return service.saveDeliveryPolicy(vo);
    }

    @ApiOperation(value = "배송정책 소프트 삭제", notes = "배송정책 템플릿을 물리 삭제하지 않고 삭제 상태로 전환한다.")
    @DeleteMapping("/delivery-policies/{policyId}")
    public ResponseEntity<ApiResponse> deleteDeliveryPolicy(@PathVariable Long policyId) {
        accessContext.requireHq();
        accessContext.requirePermission("STOREFRONT_MANAGE");
        return new ResponseEntity<>(new ApiResponse(true, "deleted", service.deleteDeliveryPolicy(policyId)), HttpStatus.OK);
    }
}

