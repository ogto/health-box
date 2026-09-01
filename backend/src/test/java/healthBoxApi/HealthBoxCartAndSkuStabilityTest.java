package healthBoxApi;

import healthBoxApi.dto.HealthBoxCartItemRequest;
import healthBoxApi.dto.HealthBoxCartItemResponse;
import healthBoxApi.dto.HealthBoxProductSaveRequest;
import healthBoxApi.dto.HealthBoxProductSkuRequest;
import healthBoxApi.payment.HealthBoxPaymentService;
import healthBoxApi.repository.*;
import healthBoxApi.vo.HealthBoxAccountVo;
import healthBoxApi.vo.HealthBoxBuyerCartItemVo;
import healthBoxApi.vo.HealthBoxBuyerMemberVo;
import healthBoxApi.vo.HealthBoxProductSkuVo;
import healthBoxApi.vo.HealthBoxProductVo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HealthBoxCartAndSkuStabilityTest {

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
    @Mock private HealthBoxOrderNumberService orderNumberService;
    @Mock private HealthBoxOrderItemRepository orderItemRepository;
    @Mock private HealthBoxPaymentRepository paymentRepository;
    @Mock private HealthBoxPaymentCancelRequestRepository paymentCancelRequestRepository;
    @Mock private HealthBoxPaymentService paymentService;
    @Mock private HealthBoxShipmentRepository shipmentRepository;
    @Mock private HealthBoxShipmentItemRepository shipmentItemRepository;
    @Mock private HealthBoxMonthlySalesSummaryRepository monthlySalesSummaryRepository;
    @Mock private HealthBoxMonthlySettlementSummaryRepository monthlySettlementSummaryRepository;

    @InjectMocks private HealthBoxService service;

    @Test
    void keepsDefaultSkuIdWhenSavingAProductWithoutOptions() throws Exception {
        HealthBoxProductVo product = product(10L, "N");
        HealthBoxProductSkuVo currentSku = sku(145L, 10L);
        when(productSkuRepository.findByProductIdOrderByIdAsc(10L))
            .thenReturn(Collections.singletonList(currentSku));
        when(productSkuRepository.findBySkuCode("HB-P-000010-DEFAULT"))
            .thenReturn(Optional.of(currentSku));
        when(productSkuRepository.save(any(HealthBoxProductSkuVo.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        HealthBoxProductSkuRequest skuRequest = new HealthBoxProductSkuRequest();
        skuRequest.setId(145L);
        skuRequest.setSkuCode("HB-P-000010-DEFAULT");
        skuRequest.setSkuName("상품");
        skuRequest.setStatus("ACTIVE");
        skuRequest.setStockQuantity(20);
        skuRequest.setSoldOutYn("N");
        HealthBoxProductSaveRequest request = new HealthBoxProductSaveRequest();
        request.setSkus(Collections.singletonList(skuRequest));

        Method sync = HealthBoxService.class.getDeclaredMethod(
            "syncProductOptionsAndSkus",
            HealthBoxProductVo.class,
            HealthBoxProductSaveRequest.class
        );
        sync.setAccessible(true);
        sync.invoke(service, product, request);

        ArgumentCaptor<HealthBoxProductSkuVo> savedSku = ArgumentCaptor.forClass(HealthBoxProductSkuVo.class);
        verify(productSkuRepository).save(savedSku.capture());
        assertSame(currentSku, savedSku.getValue());
        assertEquals(Long.valueOf(145L), savedSku.getValue().getId());
        assertEquals("N", savedSku.getValue().getDeletedYn());
        verify(productSkuRepository, never()).deleteAll(any());
    }

    @Test
    void removesOrphanedSkuRowsInsteadOfBreakingTheWholeCart() {
        mockValidBuyerSession();
        HealthBoxBuyerCartItemVo orphan = cartItem(7L, 51L);
        when(buyerCartItemRepository.findByBuyerMemberIdAndDealerMallIdOrderByIdAsc(1L, 0L))
            .thenReturn(Collections.singletonList(orphan));
        when(productSkuRepository.findById(51L)).thenReturn(Optional.empty());

        List<HealthBoxCartItemResponse> result = service.getBuyerCartItems(1L, 0L, "session-token");

        assertEquals(Collections.emptyList(), result);
        verify(buyerCartItemRepository).deleteAll(Collections.singletonList(orphan));
    }

    @Test
    void replacesAMissingSkuWithTheCurrentDefaultSkuForAProductWithoutOptions() {
        mockValidBuyerSession();
        HealthBoxProductVo product = product(10L, "N");
        HealthBoxProductSkuVo currentSku = sku(145L, 10L);
        List<HealthBoxBuyerCartItemVo> savedCartItems = new ArrayList<>();

        when(productSkuRepository.findById(51L)).thenReturn(Optional.empty());
        when(productSkuRepository.findById(145L)).thenReturn(Optional.of(currentSku));
        when(productSkuRepository.findByProductIdOrderByIdAsc(10L))
            .thenReturn(Collections.singletonList(currentSku));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(buyerCartItemRepository.findByBuyerMemberIdAndDealerMallIdAndSkuId(1L, 0L, 145L))
            .thenReturn(Optional.empty());
        when(buyerCartItemRepository.save(any(HealthBoxBuyerCartItemVo.class))).thenAnswer(invocation -> {
            HealthBoxBuyerCartItemVo saved = invocation.getArgument(0);
            savedCartItems.add(saved);
            return saved;
        });
        when(buyerCartItemRepository.findByBuyerMemberIdAndDealerMallIdOrderByIdAsc(1L, 0L))
            .thenAnswer(invocation -> new ArrayList<>(savedCartItems));

        HealthBoxCartItemRequest request = new HealthBoxCartItemRequest();
        request.setBuyerMemberId(1L);
        request.setDealerMallId(0L);
        request.setSessionToken("session-token");
        request.setProductId(10L);
        request.setSkuId(51L);
        request.setQuantity(1);

        List<HealthBoxCartItemResponse> result = service.upsertBuyerCartItem(request);

        assertEquals(1, result.size());
        assertEquals(Long.valueOf(145L), result.get(0).getSkuId());
        assertEquals(Long.valueOf(145L), savedCartItems.get(0).getSkuId());
        verify(buyerCartItemRepository).deleteByBuyerMemberIdAndDealerMallIdAndSkuId(1L, 0L, 51L);
    }

    private void mockValidBuyerSession() {
        HealthBoxBuyerMemberVo buyer = new HealthBoxBuyerMemberVo();
        buyer.setId(1L);
        buyer.setDealerMallId(0L);
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

    private HealthBoxProductVo product(Long id, String optionUseYn) {
        HealthBoxProductVo product = new HealthBoxProductVo();
        product.setId(id);
        product.setProductCode("HB-P-000010");
        product.setName("엠에스엠 골드 1550");
        product.setOptionUseYn(optionUseYn);
        product.setStatus("ACTIVE");
        product.setDeletedYn("N");
        product.setConsumerPrice(90000);
        product.setMemberPrice(60000);
        return product;
    }

    private HealthBoxProductSkuVo sku(Long id, Long productId) {
        HealthBoxProductSkuVo sku = new HealthBoxProductSkuVo();
        sku.setId(id);
        sku.setProductId(productId);
        sku.setSkuCode("HB-P-000010-DEFAULT");
        sku.setSkuName("상품");
        sku.setStatus("ACTIVE");
        sku.setDeletedYn("N");
        sku.setSoldOutYn("N");
        sku.setStockQuantity(20);
        return sku;
    }

    private HealthBoxBuyerCartItemVo cartItem(Long id, Long skuId) {
        HealthBoxBuyerCartItemVo cartItem = new HealthBoxBuyerCartItemVo();
        cartItem.setId(id);
        cartItem.setBuyerMemberId(1L);
        cartItem.setDealerMallId(0L);
        cartItem.setSkuId(skuId);
        cartItem.setQuantity(1);
        return cartItem;
    }
}
