package healthBoxApi;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import healthBoxApi.dto.HealthBoxAdminClaimRequest;
import healthBoxApi.dto.HealthBoxAdminClaimStatusRequest;
import healthBoxApi.dto.HealthBoxAdminOrderAddressRequest;
import healthBoxApi.dto.HealthBoxClaimResponse;
import healthBoxApi.dto.HealthBoxOrderPartialCancelRequest;
import healthBoxApi.dto.HealthBoxOrderDetailResponse;
import healthBoxApi.dto.HealthBoxShipmentDelayRequest;
import healthBoxApi.dto.HealthBoxShipmentBulkDispatchRequest;
import healthBoxApi.dto.HealthBoxShipmentBulkDispatchResponse;
import healthBoxApi.dto.HealthBoxShipmentStatusRequest;
import healthBoxApi.vo.HealthBoxShipmentVo;
import healthBoxApi.config.HealthBoxAdminAccessContext;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Api(tags = "건강창고 관리자 API > 주문/배송")
@RequestMapping("/health-box/admin")
public class HealthBoxAdminOrderController {

    private final HealthBoxService service;
    private final HealthBoxAdminAccessContext accessContext;

    public HealthBoxAdminOrderController(HealthBoxService service, HealthBoxAdminAccessContext accessContext) {
        this.service = service;
        this.accessContext = accessContext;
    }

    @ApiOperation(value = "딜러몰별 주문 목록 조회", notes = "특정 딜러몰 귀속 주문 목록을 조회한다.")
    @GetMapping("/dealer-malls/{dealerMallId}/orders")
    public List<HealthBoxOrderDetailResponse> getOrdersByDealerMall(@PathVariable Long dealerMallId) {
        accessContext.requirePermission("ORDER_VIEW");
        accessContext.requireDealerMallAccess(dealerMallId);
        return service.getOrdersByDealerMall(dealerMallId);
    }

    @ApiOperation(value = "전체 주문 목록 조회", notes = "전체 주문 목록을 조회한다.")
    @GetMapping("/orders")
    public List<HealthBoxOrderDetailResponse> getOrders() {
        accessContext.requirePermission("ORDER_VIEW");
        return accessContext.isDealer()
            ? service.getOrdersByDealerMall(accessContext.getDealerMallId())
            : service.getOrders();
    }

    @ApiOperation(value = "주문 상세 조회", notes = "관리자용 주문 상세를 조회한다.")
    @GetMapping("/orders/{orderId}")
    public HealthBoxOrderDetailResponse getOrder(@PathVariable Long orderId) {
        accessContext.requirePermission("ORDER_VIEW");
        HealthBoxOrderDetailResponse order = service.getOrderDetail(orderId);
        accessContext.requireDealerMallAccess(order.getDealerMallId());
        return order;
    }

    @ApiOperation(value = "주문 취소", notes = "주문을 취소하고 SKU 재고를 복구한다.")
    @PostMapping("/orders/{orderId}/cancel")
    public HealthBoxOrderDetailResponse cancelOrder(@PathVariable Long orderId) {
        accessContext.requirePermission("ORDER_PROCESS");
        accessContext.requireDealerMallAccess(service.getOrderDetail(orderId).getDealerMallId());
        return service.cancelOrder(orderId);
    }

    @ApiOperation(value = "주문 부분 취소", notes = "주문상품 단위로 일부 수량을 취소하고 SKU 재고를 복구한다.")
    @PostMapping("/orders/{orderId}/partial-cancel")
    public HealthBoxOrderDetailResponse partialCancelOrder(
        @PathVariable Long orderId,
        @RequestBody HealthBoxOrderPartialCancelRequest request
    ) {
        accessContext.requirePermission("ORDER_PROCESS");
        accessContext.requireDealerMallAccess(service.getOrderDetail(orderId).getDealerMallId());
        return service.partialCancelOrder(orderId, request);
    }

    @ApiOperation(value = "주문 배송지 수정", notes = "출고 전 주문의 수령인과 배송지를 수정한다.")
    @PutMapping("/orders/{orderId}/shipping-address")
    public HealthBoxOrderDetailResponse updateOrderShippingAddress(
        @PathVariable Long orderId,
        @RequestBody HealthBoxAdminOrderAddressRequest request
    ) {
        accessContext.requirePermission("ORDER_PROCESS");
        accessContext.requireDealerMallAccess(service.getOrderDetail(orderId).getDealerMallId());
        return service.updateOrderShippingAddress(orderId, request);
    }

    @ApiOperation(value = "주문 클레임 접수", notes = "관리자가 취소·반품·교환 클레임을 접수한다.")
    @PostMapping("/orders/{orderId}/claims")
    public HealthBoxClaimResponse createOrderClaim(
        @PathVariable Long orderId,
        @RequestBody HealthBoxAdminClaimRequest request
    ) {
        accessContext.requirePermission("ORDER_PROCESS");
        accessContext.requireDealerMallAccess(service.getOrderDetail(orderId).getDealerMallId());
        return service.createAdminClaim(orderId, request);
    }

    @ApiOperation(value = "주문 클레임 처리", notes = "클레임을 승인·반려·완료 처리한다.")
    @PutMapping("/orders/{orderId}/claims/{claimId}/status")
    public HealthBoxClaimResponse processOrderClaim(
        @PathVariable Long orderId,
        @PathVariable Long claimId,
        @RequestBody HealthBoxAdminClaimStatusRequest request
    ) {
        accessContext.requirePermission("ORDER_PROCESS");
        accessContext.requireDealerMallAccess(service.getOrderDetail(orderId).getDealerMallId());
        return service.processAdminClaim(orderId, claimId, request);
    }

    @ApiOperation(value = "본사 배송 상태 변경", notes = "배송 상태와 택배 정보를 변경한다.")
    @PutMapping("/shipments/{shipmentId}/status")
    public HealthBoxShipmentVo updateShipmentStatus(
        @PathVariable Long shipmentId,
        @RequestBody HealthBoxShipmentStatusRequest request
    ) {
        accessContext.requirePermission("ORDER_PROCESS");
        accessContext.requireDealerMallAccess(service.getOrderDetailByShipmentId(shipmentId).getDealerMallId());
        return service.updateShipmentStatus(shipmentId, request);
    }

    @ApiOperation(value = "송장 일괄 등록", notes = "주문번호와 택배사·송장번호를 검증하고 배송중 상태로 일괄 변경한다.")
    @PostMapping("/shipments/bulk-dispatch")
    public HealthBoxShipmentBulkDispatchResponse bulkDispatchShipments(
        @RequestBody HealthBoxShipmentBulkDispatchRequest request
    ) {
        accessContext.requireHq();
        accessContext.requirePermission("ORDER_PROCESS");
        return service.bulkDispatchShipments(request);
    }

    @ApiOperation(value = "발송 지연 처리", notes = "미출고 주문을 발송 지연 상태로 변경하고 사유를 기록한다.")
    @PostMapping("/shipments/{shipmentId}/delay")
    public HealthBoxOrderDetailResponse delayShipment(
        @PathVariable Long shipmentId,
        @RequestBody HealthBoxShipmentDelayRequest request
    ) {
        accessContext.requirePermission("ORDER_PROCESS");
        accessContext.requireDealerMallAccess(service.getOrderDetailByShipmentId(shipmentId).getDealerMallId());
        return service.delayShipment(shipmentId, request);
    }
}

