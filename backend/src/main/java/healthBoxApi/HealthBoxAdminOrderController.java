package healthBoxApi;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import healthBoxApi.dto.HealthBoxOrderPartialCancelRequest;
import healthBoxApi.dto.HealthBoxOrderDetailResponse;
import healthBoxApi.dto.HealthBoxShipmentStatusRequest;
import healthBoxApi.vo.HealthBoxShipmentVo;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Api(tags = "건강창고 관리자 API > 주문/배송")
@RequestMapping("/health-box/admin")
public class HealthBoxAdminOrderController {

    private final HealthBoxService service;

    public HealthBoxAdminOrderController(HealthBoxService service) {
        this.service = service;
    }

    @ApiOperation(value = "딜러몰별 주문 목록 조회", notes = "특정 딜러몰 귀속 주문 목록을 조회한다.")
    @GetMapping("/dealer-malls/{dealerMallId}/orders")
    public List<HealthBoxOrderDetailResponse> getOrdersByDealerMall(@PathVariable Long dealerMallId) {
        return service.getOrdersByDealerMall(dealerMallId);
    }

    @ApiOperation(value = "전체 주문 목록 조회", notes = "전체 주문 목록을 조회한다.")
    @GetMapping("/orders")
    public List<HealthBoxOrderDetailResponse> getOrders() {
        return service.getOrders();
    }

    @ApiOperation(value = "주문 상세 조회", notes = "관리자용 주문 상세를 조회한다.")
    @GetMapping("/orders/{orderId}")
    public HealthBoxOrderDetailResponse getOrder(@PathVariable Long orderId) {
        return service.getOrderDetail(orderId);
    }

    @ApiOperation(value = "주문 취소", notes = "주문을 취소하고 SKU 재고를 복구한다.")
    @PostMapping("/orders/{orderId}/cancel")
    public HealthBoxOrderDetailResponse cancelOrder(@PathVariable Long orderId) {
        return service.cancelOrder(orderId);
    }

    @ApiOperation(value = "주문 부분 취소", notes = "주문상품 단위로 일부 수량을 취소하고 SKU 재고를 복구한다.")
    @PostMapping("/orders/{orderId}/partial-cancel")
    public HealthBoxOrderDetailResponse partialCancelOrder(
        @PathVariable Long orderId,
        @RequestBody HealthBoxOrderPartialCancelRequest request
    ) {
        return service.partialCancelOrder(orderId, request);
    }

    @ApiOperation(value = "본사 배송 상태 변경", notes = "배송 상태와 택배 정보를 변경한다.")
    @PutMapping("/shipments/{shipmentId}/status")
    public HealthBoxShipmentVo updateShipmentStatus(
        @PathVariable Long shipmentId,
        @RequestBody HealthBoxShipmentStatusRequest request
    ) {
        return service.updateShipmentStatus(shipmentId, request);
    }
}

