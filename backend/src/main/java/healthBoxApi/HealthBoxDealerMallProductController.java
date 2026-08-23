package healthBoxApi;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import healthBoxApi.dto.HealthBoxDealerProductDetailResponse;
import healthBoxApi.dto.HealthBoxDealerProductSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Api(tags = "건강창고 딜러몰 API > 상품")
@RequestMapping("/health-box/dealer-malls/{dealerSlug}")
public class HealthBoxDealerMallProductController {

    private final HealthBoxService service;

    public HealthBoxDealerMallProductController(HealthBoxService service) {
        this.service = service;
    }

    @ApiOperation(value = "딜러몰 상품 목록 조회", notes = "딜러몰 공개 상품 목록을 필터와 함께 조회한다.")
    @GetMapping("/products")
    public Page<HealthBoxDealerProductSummaryResponse> getDealerMallProducts(
        @PathVariable String dealerSlug,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String category,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return service.getDealerMallProducts(dealerSlug, q, category, page, size);
    }

    @ApiOperation(value = "딜러몰 상품 상세 조회", notes = "딜러몰 공개 상품 상세를 slug 기준으로 조회한다.")
    @GetMapping("/products/{productSlug}")
    public HealthBoxDealerProductDetailResponse getDealerMallProduct(
        @PathVariable String dealerSlug,
        @PathVariable String productSlug
    ) {
        return service.getDealerMallProductDetail(dealerSlug, productSlug);
    }
}

