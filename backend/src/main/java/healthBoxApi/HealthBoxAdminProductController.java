package healthBoxApi;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import healthBoxApi.dto.HealthBoxProductDetailResponse;
import healthBoxApi.dto.HealthBoxProductSaveRequest;
import healthBoxApi.dto.HealthBoxProductSkuResponse;
import healthBoxApi.dto.HealthBoxProductSkuStockUpdateRequest;
import healthBoxApi.dto.HealthBoxProductSummaryResponse;
import healthBoxApi.dto.HealthBoxProductInquiryAnswerRequest;
import healthBoxApi.dto.HealthBoxProductInquiryResponse;
import healthBoxApi.payload.ApiResponse;
import healthBoxApi.config.HealthBoxAdminAccessContext;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Api(tags = "건강창고 관리자 API > 상품")
@RequestMapping("/health-box/admin")
public class HealthBoxAdminProductController {

    private final HealthBoxService service;
    private final HealthBoxAdminAccessContext accessContext;

    public HealthBoxAdminProductController(HealthBoxService service, HealthBoxAdminAccessContext accessContext) {
        this.service = service;
        this.accessContext = accessContext;
    }

    @ApiOperation(value = "본사 상품 저장", notes = "본사 상품을 등록/수정한다.")
    @PutMapping("/products")
    public HealthBoxProductDetailResponse saveProduct(@RequestBody HealthBoxProductSaveRequest request) {
        accessContext.requireHq();
        accessContext.requirePermission("PRODUCT_MANAGE");
        return service.saveProduct(request);
    }

    @ApiOperation(value = "본사 상품 목록 조회", notes = "본사 상품 목록을 조건별로 조회한다.")
    @GetMapping("/products")
    public Page<HealthBoxProductSummaryResponse> getProducts(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        accessContext.requireHqOrPublicRead("PRODUCT_VIEW");
        return service.getProducts(q, category, status, page, size);
    }

    @ApiOperation(value = "본사 상품 상세 조회", notes = "본사 상품 상세를 조회한다.")
    @GetMapping("/products/{productId}")
    public HealthBoxProductDetailResponse getProduct(@PathVariable Long productId) {
        accessContext.requireHqOrPublicRead("PRODUCT_VIEW");
        return service.getProduct(productId);
    }

    @ApiOperation(value = "상품 문의 목록 조회", notes = "관리자가 비밀글을 포함한 상품 문의를 조회한다.")
    @GetMapping("/products/{productId}/inquiries")
    public List<HealthBoxProductInquiryResponse> getProductInquiries(@PathVariable Long productId) {
        accessContext.requireHq();
        accessContext.requirePermission("PRODUCT_VIEW");
        return service.getAdminProductInquiries(productId);
    }

    @ApiOperation(value = "상품 문의 답변 저장", notes = "관리자가 상품 문의 답변을 등록하거나 수정한다.")
    @PutMapping("/product-inquiries/{inquiryId}/answer")
    public HealthBoxProductInquiryResponse answerProductInquiry(
        @PathVariable Long inquiryId,
        @RequestBody HealthBoxProductInquiryAnswerRequest request
    ) {
        accessContext.requireHq();
        accessContext.requirePermission("PRODUCT_MANAGE");
        return service.answerProductInquiry(inquiryId, request);
    }

    @ApiOperation(value = "본사 상품 SKU 목록 조회", notes = "특정 상품의 SKU 및 재고 정보를 조회한다.")
    @GetMapping("/products/{productId}/skus")
    public List<HealthBoxProductSkuResponse> getProductSkus(@PathVariable Long productId) {
        accessContext.requireHq();
        accessContext.requirePermission("PRODUCT_VIEW");
        return service.getProductSkus(productId);
    }

    @ApiOperation(value = "본사 상품 소프트 삭제", notes = "본사 상품을 물리 삭제하지 않고 삭제 상태로 전환한다.")
    @DeleteMapping("/products/{productId}")
    public ResponseEntity<ApiResponse> deleteProduct(@PathVariable Long productId) {
        accessContext.requireHq();
        accessContext.requirePermission("PRODUCT_MANAGE");
        return new ResponseEntity<>(
            new ApiResponse(true, "deleted", service.deleteProduct(productId)),
            HttpStatus.OK
        );
    }

    @ApiOperation(value = "본사 상품 SKU 재고 수정", notes = "특정 SKU의 재고/안전재고/품절 상태를 수정한다.")
    @PutMapping("/skus/{skuId}/stock")
    public HealthBoxProductSkuResponse updateProductSkuStock(
        @PathVariable Long skuId,
        @RequestBody HealthBoxProductSkuStockUpdateRequest request
    ) {
        accessContext.requireHq();
        accessContext.requirePermission("PRODUCT_MANAGE");
        return service.updateProductSkuStock(skuId, request);
    }
}

