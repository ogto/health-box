package healthBoxApi;

import healthBoxApi.dto.HealthBoxOrderCreateItemRequest;
import healthBoxApi.dto.HealthBoxOrderCreateRequest;
import healthBoxApi.dto.HealthBoxOrderDetailResponse;
import healthBoxApi.dto.HealthBoxOrderPaymentRequest;
import healthBoxApi.dto.HealthBoxOrderQuoteResponse;
import healthBoxApi.dto.HealthBoxBuyerOrderCancelRequest;
import healthBoxApi.dto.HealthBoxOrderCancellationResponse;
import healthBoxApi.payment.HealthBoxPaymentResponse;
import healthBoxApi.payment.HealthBoxPaymentService;
import healthBoxApi.repository.*;
import healthBoxApi.vo.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HealthBoxOrderFlowTest {

    @Mock private HealthBoxDealerMallRepository dealerMallRepository;
    @Mock private HealthBoxDealerApplicationRepository dealerApplicationRepository;
    @Mock private HealthBoxBuyerSignupApplicationRepository buyerSignupApplicationRepository;
    @Mock private HealthBoxBuyerMemberRepository buyerMemberRepository;
    @Mock private HealthBoxBuyerAddressRepository buyerAddressRepository;
    @Mock private HealthBoxBuyerCartItemRepository buyerCartItemRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private HealthBoxAccountRepository accountRepository;
    @Mock private HealthBoxAccountRoleRepository accountRoleRepository;
    @Mock private HealthBoxCategoryRepository categoryRepository;
    @Mock private HealthBoxPublicSiteConfigRepository publicSiteConfigRepository;
    @Mock private HealthBoxDealerMallPublicConfigRepository dealerMallPublicConfigRepository;
    @Mock private HealthBoxProductRepository productRepository;
    @Mock private HealthBoxProductMediaRepository productMediaRepository;
    @Mock private HealthBoxProductOptionGroupRepository productOptionGroupRepository;
    @Mock private HealthBoxProductOptionValueRepository productOptionValueRepository;
    @Mock private HealthBoxProductSkuRepository productSkuRepository;
    @Mock private HealthBoxProductSkuOptionRepository productSkuOptionRepository;
    @Mock private HealthBoxSalesPolicyRepository salesPolicyRepository;
    @Mock private HealthBoxDeliveryPolicyRepository deliveryPolicyRepository;
    @Mock private HealthBoxNoticeRepository noticeRepository;
    @Mock private HealthBoxProductInquiryRepository productInquiryRepository;
    @Mock private HealthBoxOrderRepository orderRepository;
    @Mock private HealthBoxOrderItemRepository orderItemRepository;
    @Mock private HealthBoxPaymentRepository paymentRepository;
    @Mock private HealthBoxPaymentCancelRequestRepository paymentCancelRequestRepository;
    @Mock private HealthBoxClaimRepository claimRepository;
    @Mock private HealthBoxPaymentService paymentService;
    @Mock private HealthBoxShipmentRepository shipmentRepository;
    @Mock private HealthBoxShipmentItemRepository shipmentItemRepository;
    @Mock private HealthBoxMonthlySalesSummaryRepository monthlySalesSummaryRepository;
    @Mock private HealthBoxMonthlySettlementSummaryRepository monthlySettlementSummaryRepository;

    @InjectMocks private HealthBoxService service;

    @Test
    void createsHqOrderWithoutDealerRowAndClearsPurchasedCartItem() throws Exception {
        mockBuyerSession(0L);
        HealthBoxProductVo product = product();
        HealthBoxProductSkuVo sku = sku();
        HealthBoxOrderCreateRequest request = orderRequest(0L);
        AtomicReference<HealthBoxPaymentVo> savedPayment = new AtomicReference<>();

        when(productSkuRepository.findById(145L)).thenReturn(Optional.of(sku));
        when(productSkuRepository.findWithLockById(145L)).thenReturn(Optional.of(sku));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(publicSiteConfigRepository.findById(1L)).thenReturn(Optional.empty());
        when(paymentRepository.findByPaymentOrderId("healthbox_order_test_1")).thenReturn(Optional.empty());
        when(paymentRepository.findByPaymentKey("test_payment_key_1")).thenReturn(Optional.empty());
        when(paymentService.getTestPayment("test_payment_key_1")).thenReturn(confirmedPayment());
        when(productSkuRepository.save(any(HealthBoxProductSkuVo.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.save(any(HealthBoxOrderVo.class))).thenAnswer(invocation -> {
            HealthBoxOrderVo order = invocation.getArgument(0);
            if (order.getId() == null) {
                order.setId(42L);
            }
            return order;
        });
        when(orderItemRepository.save(any(HealthBoxOrderItemVo.class))).thenAnswer(invocation -> {
            HealthBoxOrderItemVo item = invocation.getArgument(0);
            item.setId(84L);
            return item;
        });
        when(paymentRepository.save(any(HealthBoxPaymentVo.class))).thenAnswer(invocation -> {
            HealthBoxPaymentVo payment = invocation.getArgument(0);
            payment.setId(126L);
            savedPayment.set(payment);
            return payment;
        });
        when(paymentRepository.findTopByOrderIdOrderByIdDesc(42L))
            .thenAnswer(invocation -> Optional.ofNullable(savedPayment.get()));
        when(shipmentRepository.save(any(HealthBoxShipmentVo.class))).thenAnswer(invocation -> {
            HealthBoxShipmentVo shipment = invocation.getArgument(0);
            shipment.setId(168L);
            return shipment;
        });
        when(shipmentItemRepository.save(any(HealthBoxShipmentItemVo.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        HealthBoxOrderDetailResponse order = service.createOrder(request);

        assertEquals(Long.valueOf(0L), order.getDealerMallId());
        assertEquals("everybuy.co.kr", order.getDealerSlugSnapshot());
        assertEquals("본사몰", order.getDealerNameSnapshot());
        assertEquals(Integer.valueOf(60000), order.getTotalPaymentAmount());
        assertTrue(order.getOrderNo().matches("\\d{16}"));
        assertTrue(order.getOrderNo().endsWith("00000042"));
        assertEquals(Integer.valueOf(19), sku.getStockQuantity());
        verify(dealerMallRepository, never()).findById(any());
        verify(orderRepository, never()).countByOrderedAtBetween(any(), any());
        verify(buyerCartItemRepository)
            .deleteByBuyerMemberIdAndDealerMallIdAndSkuId(1L, 0L, 145L);
    }

    @Test
    void quotesActiveDealerOrderBeforePayment() {
        mockBuyerSession(9L);
        HealthBoxDealerMallVo dealer = dealerMall(9L, "ACTIVE");
        when(dealerMallRepository.findById(9L)).thenReturn(Optional.of(dealer));
        when(productSkuRepository.findById(145L)).thenReturn(Optional.of(sku()));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product()));
        when(dealerMallPublicConfigRepository.findByDealerMallId(9L)).thenReturn(Optional.empty());
        when(publicSiteConfigRepository.findById(1L)).thenReturn(Optional.empty());

        HealthBoxOrderQuoteResponse quote = service.quoteOrder(orderRequestWithoutPayment(9L));

        assertEquals(Integer.valueOf(60000), quote.getProductAmount());
        assertEquals(Integer.valueOf(0), quote.getShippingFee());
        assertEquals(Integer.valueOf(60000), quote.getTotalPaymentAmount());
    }

    @Test
    void rejectsInactiveDealerDuringQuoteBeforePaymentApproval() throws Exception {
        mockBuyerSession(9L);
        when(dealerMallRepository.findById(9L)).thenReturn(Optional.of(dealerMall(9L, "INACTIVE")));

        IllegalArgumentException error = assertThrows(
            IllegalArgumentException.class,
            () -> service.quoteOrder(orderRequestWithoutPayment(9L))
        );

        assertEquals("dealer mall is inactive. id=9", error.getMessage());
        verify(productSkuRepository, never()).findById(any());
        verify(paymentService, never()).getLivePayment(any());
    }

    @Test
    void immediatelyCancelsBuyerOrderWhileShipmentIsPending() throws Exception {
        mockBuyerSession(0L);
        HealthBoxOrderVo order = paidOrder("ORDERED");
        HealthBoxShipmentVo shipment = shipment("PENDING");
        HealthBoxOrderItemVo item = orderItem();
        HealthBoxPaymentVo payment = orderPayment();
        HealthBoxProductSkuVo sku = sku();
        sku.setStockQuantity(19);
        HealthBoxPaymentResponse canceledPayment = new HealthBoxPaymentResponse();
        canceledPayment.setStatus("CANCELED");

        when(orderRepository.findBuyerOrderWithLock(42L, 1L, 0L)).thenReturn(Optional.of(order));
        when(orderRepository.findById(42L)).thenReturn(Optional.of(order));
        when(shipmentRepository.findByOrderId(42L)).thenReturn(Optional.of(shipment));
        when(orderItemRepository.findByOrderIdOrderByIdAsc(42L)).thenReturn(Collections.singletonList(item));
        when(paymentRepository.findTopByOrderIdOrderByIdDesc(42L)).thenReturn(Optional.of(payment));
        when(productSkuRepository.findWithLockById(145L)).thenReturn(Optional.of(sku));
        when(paymentService.cancelLivePayment("live-payment-key", "판매자 주문 전체 취소", null, "healthbox-full-cancel-42"))
            .thenReturn(canceledPayment);
        when(orderRepository.save(any(HealthBoxOrderVo.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderItemRepository.save(any(HealthBoxOrderItemVo.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.save(any(HealthBoxPaymentVo.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productSkuRepository.save(any(HealthBoxProductSkuVo.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(shipmentRepository.save(any(HealthBoxShipmentVo.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(claimRepository.save(any(HealthBoxClaimVo.class))).thenAnswer(invocation -> invocation.getArgument(0));

        HealthBoxOrderCancellationResponse response = service.requestBuyerOrderCancellation(42L, cancellationRequest());

        assertEquals("CANCELED", response.getAction());
        assertEquals("CANCELED", order.getOrderStatus());
        assertEquals("CANCELED", shipment.getShipmentStatus());
        assertEquals(Integer.valueOf(0), order.getRemainingPaymentAmount());
        assertEquals(Integer.valueOf(20), sku.getStockQuantity());
        verify(paymentService).cancelLivePayment(
            "live-payment-key",
            "판매자 주문 전체 취소",
            null,
            "healthbox-full-cancel-42"
        );
    }

    @Test
    void createsCancellationRequestAfterProductPreparationStarts() throws Exception {
        mockBuyerSession(0L);
        HealthBoxOrderVo order = paidOrder("ORDERED");
        HealthBoxShipmentVo shipment = shipment("PREPARING");
        when(orderRepository.findBuyerOrderWithLock(42L, 1L, 0L)).thenReturn(Optional.of(order));
        when(shipmentRepository.findByOrderId(42L)).thenReturn(Optional.of(shipment));
        when(orderItemRepository.findByOrderIdOrderByIdAsc(42L)).thenReturn(Collections.singletonList(orderItem()));
        when(claimRepository.save(any(HealthBoxClaimVo.class))).thenAnswer(invocation -> invocation.getArgument(0));

        HealthBoxOrderCancellationResponse response = service.requestBuyerOrderCancellation(42L, cancellationRequest());

        ArgumentCaptor<HealthBoxClaimVo> claimCaptor = ArgumentCaptor.forClass(HealthBoxClaimVo.class);
        verify(claimRepository).save(claimCaptor.capture());
        assertEquals("REQUESTED", response.getAction());
        assertEquals("REQUESTED", claimCaptor.getValue().getStatus());
        assertEquals("CANCEL", claimCaptor.getValue().getClaimType());
        assertEquals(Integer.valueOf(60000), claimCaptor.getValue().getAmount());
        verify(paymentService, never()).cancelLivePayment(any(), any(), any(), any());
    }

    private void mockBuyerSession(Long dealerMallId) {
        HealthBoxBuyerMemberVo buyer = new HealthBoxBuyerMemberVo();
        buyer.setId(1L);
        buyer.setDealerMallId(dealerMallId);
        buyer.setAccountId(2L);
        buyer.setStatus("ACTIVE");
        when(buyerMemberRepository.findById(1L)).thenReturn(Optional.of(buyer));

        HealthBoxAccountVo account = new HealthBoxAccountVo();
        account.setId(2L);
        account.setStatus("ACTIVE");
        account.setSessionToken("session-token");
        account.setSessionExpiredAt(LocalDateTime.now().plusHours(1));
        when(accountRepository.findById(2L)).thenReturn(Optional.of(account));
    }

    private HealthBoxOrderCreateRequest orderRequest(Long dealerMallId) {
        HealthBoxOrderCreateRequest request = orderRequestWithoutPayment(dealerMallId);
        HealthBoxOrderPaymentRequest payment = new HealthBoxOrderPaymentRequest();
        payment.setProvider("TOSS_TEST");
        payment.setPaymentKey("test_payment_key_1");
        payment.setPaymentOrderId("healthbox_order_test_1");
        payment.setMethod("카드");
        payment.setPaymentMethodName("테스트 카드");
        payment.setPaidAmount(60000);
        request.setPayment(payment);
        request.setPaymentStatus("PAID");
        request.setOrderStatus("ORDERED");
        request.setProductAmount(60000);
        request.setShippingFee(0);
        request.setDiscountAmount(0);
        request.setTotalPaymentAmount(60000);
        return request;
    }

    private HealthBoxBuyerOrderCancelRequest cancellationRequest() {
        HealthBoxBuyerOrderCancelRequest request = new HealthBoxBuyerOrderCancelRequest();
        request.setBuyerMemberId(1L);
        request.setDealerMallId(0L);
        request.setSessionToken("session-token");
        request.setReason("회원 주문 취소");
        return request;
    }

    private HealthBoxOrderVo paidOrder(String orderStatus) {
        HealthBoxOrderVo order = new HealthBoxOrderVo();
        order.setId(42L);
        order.setOrderNo("2026090100000042");
        order.setBuyerMemberId(1L);
        order.setDealerMallId(0L);
        order.setDealerSlugSnapshot("everybuy.co.kr");
        order.setDealerNameSnapshot("본사몰");
        order.setOrdererName("테스트 회원");
        order.setOrdererPhone("01012345678");
        order.setReceiverName("테스트 회원");
        order.setReceiverPhone("01012345678");
        order.setBaseAddress("서울특별시 종로구 테스트로 1");
        order.setPaymentStatus("PAID");
        order.setOrderStatus(orderStatus);
        order.setOrderedAt(LocalDateTime.now());
        order.setProductAmount(60000);
        order.setShippingFee(0);
        order.setDiscountAmount(0);
        order.setTotalPaymentAmount(60000);
        order.setRemainingPaymentAmount(60000);
        order.setCanceledPaymentAmount(0);
        return order;
    }

    private HealthBoxShipmentVo shipment(String status) {
        HealthBoxShipmentVo shipment = new HealthBoxShipmentVo();
        shipment.setId(168L);
        shipment.setOrderId(42L);
        shipment.setShipmentStatus(status);
        return shipment;
    }

    private HealthBoxOrderItemVo orderItem() {
        HealthBoxOrderItemVo item = new HealthBoxOrderItemVo();
        item.setId(84L);
        item.setOrderId(42L);
        item.setProductId(10L);
        item.setSkuId(145L);
        item.setSkuCodeSnapshot("HB-P-000010-DEFAULT");
        item.setSkuNameSnapshot("상품");
        item.setProductNameSnapshot("엠에스엠 골드 1550");
        item.setPriceSnapshot(60000);
        item.setQuantity(1);
        item.setCanceledQuantity(0);
        item.setLineAmount(60000);
        return item;
    }

    private HealthBoxPaymentVo orderPayment() {
        HealthBoxPaymentVo payment = new HealthBoxPaymentVo();
        payment.setId(126L);
        payment.setOrderId(42L);
        payment.setBuyerMemberId(1L);
        payment.setDealerMallId(0L);
        payment.setOrderNo("2026090100000042");
        payment.setProvider("TOSS");
        payment.setPaymentKey("live-payment-key");
        payment.setStatus("PAID");
        payment.setPaidAmount(60000);
        payment.setCanceledAmount(0);
        payment.setRemainingAmount(60000);
        return payment;
    }

    private HealthBoxOrderCreateRequest orderRequestWithoutPayment(Long dealerMallId) {
        HealthBoxOrderCreateItemRequest item = new HealthBoxOrderCreateItemRequest();
        item.setSkuId(145L);
        item.setQuantity(1);

        HealthBoxOrderCreateRequest request = new HealthBoxOrderCreateRequest();
        request.setBuyerMemberId(1L);
        request.setDealerMallId(dealerMallId);
        request.setSessionToken("session-token");
        request.setOrdererName("테스트 회원");
        request.setOrdererPhone("01012345678");
        request.setReceiverName("테스트 회원");
        request.setReceiverPhone("01012345678");
        request.setZipCode("03000");
        request.setBaseAddress("서울특별시 종로구 테스트로 1");
        request.setDetailAddress("101호");
        request.setItems(Collections.singletonList(item));
        return request;
    }

    private HealthBoxProductVo product() {
        HealthBoxProductVo product = new HealthBoxProductVo();
        product.setId(10L);
        product.setProductCode("HB-P-000010");
        product.setName("엠에스엠 골드 1550");
        product.setOptionUseYn("N");
        product.setStatus("ACTIVE");
        product.setDeletedYn("N");
        product.setConsumerPrice(90000);
        product.setMemberPrice(60000);
        return product;
    }

    private HealthBoxProductSkuVo sku() {
        HealthBoxProductSkuVo sku = new HealthBoxProductSkuVo();
        sku.setId(145L);
        sku.setProductId(10L);
        sku.setSkuCode("HB-P-000010-DEFAULT");
        sku.setSkuName("상품");
        sku.setStatus("ACTIVE");
        sku.setDeletedYn("N");
        sku.setSoldOutYn("N");
        sku.setStockQuantity(20);
        return sku;
    }

    private HealthBoxPaymentResponse confirmedPayment() {
        HealthBoxPaymentResponse payment = new HealthBoxPaymentResponse();
        payment.setPaymentKey("test_payment_key_1");
        payment.setOrderId("healthbox_order_test_1");
        payment.setStatus("DONE");
        payment.setTotalAmount(60000);
        return payment;
    }

    private HealthBoxDealerMallVo dealerMall(Long id, String status) {
        HealthBoxDealerMallVo dealer = new HealthBoxDealerMallVo();
        dealer.setId(id);
        dealer.setSlug("dealer-" + id);
        dealer.setMallName("테스트 딜러몰");
        dealer.setDisplayName("테스트 딜러");
        dealer.setStatus(status);
        return dealer;
    }
}
