package healthBoxApi;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import healthBoxApi.dto.HealthBoxBuyerLoginRequest;
import healthBoxApi.dto.HealthBoxBuyerLoginResponse;
import healthBoxApi.dto.HealthBoxBuyerPasswordResetRequest;
import healthBoxApi.dto.HealthBoxBuyerProfileUpdateRequest;
import healthBoxApi.dto.HealthBoxBuyerAddressRequest;
import healthBoxApi.dto.HealthBoxBuyerAddressResponse;
import healthBoxApi.dto.HealthBoxBuyerOrderCancelRequest;
import healthBoxApi.dto.HealthBoxCartItemRequest;
import healthBoxApi.dto.HealthBoxCartItemResponse;
import healthBoxApi.dto.HealthBoxOrderCreateRequest;
import healthBoxApi.dto.HealthBoxOrderDetailResponse;
import healthBoxApi.dto.HealthBoxOrderCancellationResponse;
import healthBoxApi.dto.HealthBoxOrderQuoteResponse;
import healthBoxApi.dto.HealthBoxProductInquiryRequest;
import healthBoxApi.dto.HealthBoxProductInquiryResponse;
import healthBoxApi.dto.HealthBoxBuyerSignupCreateRequest;
import healthBoxApi.dto.HealthBoxBuyerSignupAvailabilityRequest;
import healthBoxApi.dto.HealthBoxBuyerSignupAvailabilityResponse;
import healthBoxApi.dto.HealthBoxDealerContextResponse;
import healthBoxApi.dto.HealthBoxDealerApplicationCreateRequest;
import healthBoxApi.dto.HealthBoxDealerPublicResponse;
import healthBoxApi.vo.HealthBoxBuyerSignupApplicationVo;
import healthBoxApi.vo.HealthBoxDealerApplicationVo;
import healthBoxApi.vo.HealthBoxPublicSiteConfigVo;
import healthBoxApi.vo.HealthBoxNoticeVo;
import healthBoxApi.payload.ApiResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@Api(tags = "건강창고 공개 API")
@RequestMapping("/health-box/public")
public class HealthBoxPublicController {

    private final HealthBoxService service;

    public HealthBoxPublicController(HealthBoxService service) {
        this.service = service;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse handleInvalidPublicRequest(IllegalArgumentException error) {
        return new ApiResponse(false, error.getMessage());
    }

    @ApiOperation(value = "host 기준 딜러몰 조회", notes = "요청 host를 기준으로 딜러몰 컨텍스트를 조회한다.")
    @GetMapping("/dealer-context")
    public HealthBoxDealerContextResponse resolveDealerMallByHost(@RequestParam String host) {
        return service.resolveDealerMallByHost(host);
    }

    @ApiOperation(value = "slug 기준 딜러몰 조회", notes = "slug를 기준으로 딜러몰을 조회한다.")
    @GetMapping("/dealer-malls/by-slug")
    public HealthBoxDealerPublicResponse getDealerMallBySlug(@RequestParam String slug) {
        return service.getDealerMallBySlug(slug);
    }

    @ApiOperation(value = "공통 홈페이지 설정 조회", notes = "공개몰 공통 설정을 조회한다.")
    @GetMapping("/public-site-config")
    public HealthBoxPublicSiteConfigVo getPublicSiteConfig() {
        return service.getPublicSiteConfig();
    }

    @ApiOperation(value = "공개 공지 목록 조회", notes = "본사몰 또는 딜러몰에 게시된 공지를 조회한다.")
    @GetMapping("/notices")
    public List<HealthBoxNoticeVo> getNotices(@RequestParam(required = false) Long dealerMallId) {
        return service.getPostedNotices(dealerMallId != null && dealerMallId > 0 ? dealerMallId : null);
    }

    @ApiOperation(value = "공개 공지 상세 조회", notes = "본사몰 또는 딜러몰에 게시된 공지 상세를 조회한다.")
    @GetMapping("/notices/{noticeId}")
    public HealthBoxNoticeVo getNotice(
        @PathVariable Long noticeId,
        @RequestParam(required = false) Long dealerMallId
    ) {
        return service.getNotice(noticeId, dealerMallId != null && dealerMallId > 0 ? dealerMallId : null, true);
    }

    @ApiOperation(value = "상품 문의 목록 조회", notes = "비밀글은 작성자 세션으로 조회할 때만 원문을 반환한다.")
    @GetMapping("/products/{productId}/inquiries")
    public List<HealthBoxProductInquiryResponse> getProductInquiries(
        @PathVariable Long productId,
        @RequestParam(required = false) Long buyerMemberId,
        @RequestParam(required = false) Long dealerMallId,
        @RequestParam(required = false) String sessionToken
    ) {
        return service.getPublicProductInquiries(productId, buyerMemberId, dealerMallId, sessionToken);
    }

    @ApiOperation(value = "상품 문의 등록", notes = "로그인한 구매 회원이 상품 문의를 등록한다.")
    @PostMapping("/products/{productId}/inquiries")
    public HealthBoxProductInquiryResponse createProductInquiry(
        @PathVariable Long productId,
        @RequestBody HealthBoxProductInquiryRequest request
    ) {
        request.setProductId(productId);
        return service.createProductInquiry(productId, request);
    }

    @ApiOperation(value = "딜러몰 공개 정보 조회", notes = "딜러몰 최소 공개 정보를 조회한다.")
    @GetMapping("/dealer-public-config")
    public HealthBoxDealerPublicResponse getDealerMallPublicConfig(@RequestParam String slug) {
        return service.getDealerMallPublicConfig(slug);
    }

    @ApiOperation(value = "딜러 신청", notes = "본사몰에서 신규 딜러 신청을 접수한다.")
    @PostMapping("/dealer-applications")
    public ApiResponse createDealerApplication(@RequestBody HealthBoxDealerApplicationCreateRequest request) {
        HealthBoxDealerApplicationVo application = service.createDealerApplication(request);
        return new ApiResponse(true, "dealer application created", application.getId());
    }

    @ApiOperation(value = "구매 회원 가입", notes = "공개몰에서 구매 회원 계정을 즉시 생성하고 활성화한다.")
    @PostMapping("/buyer-signup-applications")
    public ApiResponse createBuyerSignupApplication(@RequestBody HealthBoxBuyerSignupCreateRequest request) {
        HealthBoxBuyerSignupApplicationVo application = service.createBuyerSignupApplication(request);
        return new ApiResponse(true, "buyer signup completed", application.getId());
    }

    @ApiOperation(value = "구매 회원 가입 중복 확인", notes = "공개몰 가입 범위에서 이메일 또는 휴대폰 번호 사용 가능 여부를 확인한다.")
    @PostMapping("/buyer-signup-availability")
    public HealthBoxBuyerSignupAvailabilityResponse getBuyerSignupAvailability(
        @RequestBody HealthBoxBuyerSignupAvailabilityRequest request
    ) {
        return service.getBuyerSignupAvailability(request);
    }

    @ApiOperation(value = "구매 회원 로그인", notes = "공개몰 구매 회원 로그인을 처리한다.")
    @PostMapping("/buyer-auth/login")
    public HealthBoxBuyerLoginResponse loginBuyer(@RequestBody HealthBoxBuyerLoginRequest request) {
        return service.loginBuyer(request);
    }

    @ApiOperation(value = "구매 회원 비밀번호 재설정", notes = "본인 정보 확인 후 공개몰 구매 회원 비밀번호를 재설정한다.")
    @PostMapping("/buyer-auth/password-reset")
    public ApiResponse resetBuyerPassword(@RequestBody HealthBoxBuyerPasswordResetRequest request) {
        service.resetBuyerPassword(request);
        return new ApiResponse(true, "password reset", null);
    }

    @ApiOperation(value = "구매 회원 비밀번호 재설정 본인확인", notes = "공개몰 구매 회원 비밀번호 재설정 전 본인 정보를 확인한다.")
    @PostMapping("/buyer-auth/password-reset/verify")
    public ApiResponse verifyBuyerPasswordResetIdentity(@RequestBody HealthBoxBuyerPasswordResetRequest request) {
        service.verifyBuyerPasswordResetIdentity(request);
        return new ApiResponse(true, "password reset identity verified", null);
    }

    @ApiOperation(value = "구매 회원 기본 정보 수정", notes = "로그인한 구매 회원의 이름, 휴대폰 번호, 이메일을 수정한다.")
    @PutMapping("/buyer-members/{buyerMemberId}")
    public HealthBoxBuyerLoginResponse updateBuyerProfile(
        @PathVariable Long buyerMemberId,
        @RequestBody HealthBoxBuyerProfileUpdateRequest request
    ) {
        return service.updateBuyerProfile(buyerMemberId, request);
    }

    @ApiOperation(value = "구매 회원 배송지 목록 조회", notes = "로그인한 구매 회원의 저장 배송지 목록을 조회한다.")
    @GetMapping("/buyer-members/{buyerMemberId}/addresses")
    public List<HealthBoxBuyerAddressResponse> getBuyerAddresses(
        @PathVariable Long buyerMemberId,
        @RequestParam Long dealerMallId,
        @RequestParam String sessionToken
    ) {
        return service.getBuyerAddresses(buyerMemberId, dealerMallId, sessionToken);
    }

    @ApiOperation(value = "구매 회원 배송지 저장", notes = "로그인한 구매 회원의 배송지를 저장한다.")
    @PostMapping("/buyer-members/{buyerMemberId}/addresses")
    public HealthBoxBuyerAddressResponse createBuyerAddress(
        @PathVariable Long buyerMemberId,
        @RequestBody HealthBoxBuyerAddressRequest request
    ) {
        return service.createBuyerAddress(buyerMemberId, request);
    }

    @ApiOperation(value = "구매 회원 배송지 수정", notes = "로그인한 구매 회원의 저장 배송지를 수정한다.")
    @PutMapping("/buyer-members/{buyerMemberId}/addresses/{addressId}")
    public HealthBoxBuyerAddressResponse updateBuyerAddress(
        @PathVariable Long buyerMemberId,
        @PathVariable Long addressId,
        @RequestBody HealthBoxBuyerAddressRequest request
    ) {
        return service.updateBuyerAddress(buyerMemberId, addressId, request);
    }

    @ApiOperation(value = "구매 회원 배송지 삭제", notes = "로그인한 구매 회원의 저장 배송지를 삭제한다.")
    @DeleteMapping("/buyer-members/{buyerMemberId}/addresses/{addressId}")
    public ApiResponse deleteBuyerAddress(
        @PathVariable Long buyerMemberId,
        @PathVariable Long addressId,
        @RequestParam Long dealerMallId,
        @RequestParam String sessionToken
    ) {
        service.deleteBuyerAddress(buyerMemberId, addressId, dealerMallId, sessionToken);
        return new ApiResponse(true, "buyer address deleted", null);
    }

    @ApiOperation(value = "구매 주문 생성", notes = "공개몰에서 SKU 기준으로 주문을 생성하고 재고를 차감한다.")
    @PostMapping("/orders")
    public HealthBoxOrderDetailResponse createOrder(@RequestBody HealthBoxOrderCreateRequest request) {
        return service.createOrder(request);
    }

    @ApiOperation(value = "구매 주문 금액 산출", notes = "공개몰에서 SKU 기준으로 주문 가능 여부와 결제 예정 금액을 산출한다.")
    @PostMapping("/orders/quote")
    public HealthBoxOrderQuoteResponse quoteOrder(@RequestBody HealthBoxOrderCreateRequest request) {
        return service.quoteOrder(request);
    }

    @ApiOperation(value = "구매 회원 장바구니 조회", notes = "로그인한 구매 회원의 DB 장바구니를 조회한다.")
    @GetMapping("/buyer-members/{buyerMemberId}/cart")
    public List<HealthBoxCartItemResponse> getBuyerCartItems(
        @PathVariable Long buyerMemberId,
        @RequestParam Long dealerMallId,
        @RequestParam String sessionToken
    ) {
        return service.getBuyerCartItems(buyerMemberId, dealerMallId, sessionToken);
    }

    @ApiOperation(value = "구매 회원 장바구니 상품 저장", notes = "SKU 기준으로 장바구니 상품 수량을 저장한다.")
    @PutMapping("/buyer-members/{buyerMemberId}/cart/items")
    public List<HealthBoxCartItemResponse> upsertBuyerCartItem(
        @PathVariable Long buyerMemberId,
        @RequestBody HealthBoxCartItemRequest request
    ) {
        request.setBuyerMemberId(buyerMemberId);
        return service.upsertBuyerCartItem(request);
    }

    @ApiOperation(value = "구매 회원 장바구니 상품 삭제", notes = "SKU 기준으로 장바구니 상품을 삭제한다.")
    @DeleteMapping("/buyer-members/{buyerMemberId}/cart/items/{skuId}")
    public List<HealthBoxCartItemResponse> deleteBuyerCartItem(
        @PathVariable Long buyerMemberId,
        @PathVariable Long skuId,
        @RequestParam Long dealerMallId,
        @RequestParam String sessionToken
    ) {
        return service.deleteBuyerCartItem(buyerMemberId, dealerMallId, sessionToken, skuId);
    }

    @ApiOperation(value = "구매 회원 장바구니 비우기", notes = "로그인한 구매 회원의 장바구니를 비운다.")
    @DeleteMapping("/buyer-members/{buyerMemberId}/cart")
    public ApiResponse clearBuyerCart(
        @PathVariable Long buyerMemberId,
        @RequestParam Long dealerMallId,
        @RequestParam String sessionToken
    ) {
        service.clearBuyerCart(buyerMemberId, dealerMallId, sessionToken);
        return new ApiResponse(true, "cart cleared", null);
    }

    @ApiOperation(value = "내 주문 목록 조회", notes = "구매 회원 기준으로 주문 목록을 상세형으로 조회한다.")
    @GetMapping("/orders")
    public List<HealthBoxOrderDetailResponse> getMyOrders(
        @RequestParam Long buyerMemberId,
        @RequestParam Long dealerMallId,
        @RequestParam String sessionToken
    ) {
        return service.getBuyerOrders(buyerMemberId, dealerMallId, sessionToken);
    }

    @ApiOperation(value = "내 주문 상세 조회", notes = "구매 회원 기준으로 단건 주문 상세를 조회한다.")
    @GetMapping("/orders/{orderId}")
    public HealthBoxOrderDetailResponse getMyOrderDetail(
        @PathVariable Long orderId,
        @RequestParam Long buyerMemberId,
        @RequestParam Long dealerMallId,
        @RequestParam String sessionToken
    ) {
        return service.getBuyerOrderDetail(orderId, buyerMemberId, dealerMallId, sessionToken);
    }

    @ApiOperation(
        value = "내 주문 취소 또는 취소 요청",
        notes = "주문 접수 상태는 즉시 취소하고, 상품 준비 이후에는 취소 요청을 접수한다."
    )
    @PostMapping("/orders/{orderId}/cancel-request")
    public HealthBoxOrderCancellationResponse requestMyOrderCancellation(
        @PathVariable Long orderId,
        @RequestBody HealthBoxBuyerOrderCancelRequest request
    ) {
        return service.requestBuyerOrderCancellation(orderId, request);
    }
}

