package healthBoxApi;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import healthBoxApi.payment.HealthBoxPaymentResponse;
import healthBoxApi.payment.HealthBoxPaymentService;
import healthBoxApi.dto.HealthBoxApprovalRequest;
import healthBoxApi.dto.HealthBoxAdminDealerCreateRequest;
import healthBoxApi.dto.HealthBoxDealerApplicationCreateRequest;
import healthBoxApi.dto.HealthBoxBuyerLoginRequest;
import healthBoxApi.dto.HealthBoxBuyerLoginResponse;
import healthBoxApi.dto.HealthBoxBuyerPasswordResetRequest;
import healthBoxApi.dto.HealthBoxBuyerProfileUpdateRequest;
import healthBoxApi.dto.HealthBoxBuyerAddressRequest;
import healthBoxApi.dto.HealthBoxBuyerAddressResponse;
import healthBoxApi.dto.HealthBoxBuyerSignupCreateRequest;
import healthBoxApi.dto.HealthBoxBuyerSignupAvailabilityRequest;
import healthBoxApi.dto.HealthBoxBuyerSignupAvailabilityResponse;
import healthBoxApi.dto.HealthBoxCartItemRequest;
import healthBoxApi.dto.HealthBoxCartItemResponse;
import healthBoxApi.dto.HealthBoxCategoryResponse;
import healthBoxApi.dto.HealthBoxCategorySaveRequest;
import healthBoxApi.dto.HealthBoxDealerContextResponse;
import healthBoxApi.dto.HealthBoxDealerProductDetailResponse;
import healthBoxApi.dto.HealthBoxDealerProductSummaryResponse;
import healthBoxApi.dto.HealthBoxDealerPublicResponse;
import healthBoxApi.dto.HealthBoxNoticeSaveRequest;
import healthBoxApi.dto.HealthBoxOrderCreateItemRequest;
import healthBoxApi.dto.HealthBoxOrderCreateRequest;
import healthBoxApi.dto.HealthBoxOrderCancelItemRequest;
import healthBoxApi.dto.HealthBoxOrderDetailResponse;
import healthBoxApi.dto.HealthBoxOrderItemResponse;
import healthBoxApi.dto.HealthBoxOrderPartialCancelRequest;
import healthBoxApi.dto.HealthBoxOrderPaymentRequest;
import healthBoxApi.dto.HealthBoxOrderPaymentResponse;
import healthBoxApi.dto.HealthBoxOrderQuoteResponse;
import healthBoxApi.dto.HealthBoxProductDetailResponse;
import healthBoxApi.dto.HealthBoxProductMediaRequest;
import healthBoxApi.dto.HealthBoxProductMediaResponse;
import healthBoxApi.dto.HealthBoxProductOptionGroupRequest;
import healthBoxApi.dto.HealthBoxProductOptionGroupResponse;
import healthBoxApi.dto.HealthBoxProductOptionValueRequest;
import healthBoxApi.dto.HealthBoxProductOptionValueResponse;
import healthBoxApi.dto.HealthBoxProductSaveRequest;
import healthBoxApi.dto.HealthBoxProductSkuRequest;
import healthBoxApi.dto.HealthBoxProductSkuResponse;
import healthBoxApi.dto.HealthBoxProductSkuStockUpdateRequest;
import healthBoxApi.dto.HealthBoxProductSummaryResponse;
import healthBoxApi.dto.HealthBoxProductInquiryAnswerRequest;
import healthBoxApi.dto.HealthBoxProductInquiryRequest;
import healthBoxApi.dto.HealthBoxProductInquiryResponse;
import healthBoxApi.dto.HealthBoxRejectRequest;
import healthBoxApi.dto.HealthBoxShipmentStatusRequest;
import healthBoxApi.vo.*;
import healthBoxApi.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class HealthBoxService {

    private static final long SINGLETON_PUBLIC_SITE_CONFIG_ID = 1L;
    private static final long DEFAULT_HQ_ID = 1L;
    private static final long HQ_BUYER_DEALER_MALL_ID = 0L;
    private static final String BUYER_SIGNUP_CONSENT_VERSION = "v1.0";
    private static final String DEALER_APPLICATION_CONSENT_VERSION = "v1.0";
    private static final String ROOT_HOST = "everybuy.co.kr";
    private static final String WWW_ROOT_HOST = "www.everybuy.co.kr";
    private static final String ROOT_DOMAIN = ".everybuy.co.kr";
    private static final int DEFAULT_BASE_SHIPPING_FEE = 3000;
    private static final int DEFAULT_FREE_SHIPPING_THRESHOLD = 50000;
    private static final int DEFAULT_REMOTE_AREA_FEE = 0;
    private static final List<int[]> DEFAULT_REMOTE_AREA_ZIP_RANGES = Collections.unmodifiableList(Arrays.asList(
        new int[] { 63000, 63644 },
        new int[] { 40200, 40240 }
    ));

    private final HealthBoxDealerMallRepository dealerMallRepository;
    private final HealthBoxDealerApplicationRepository dealerApplicationRepository;
    private final HealthBoxBuyerSignupApplicationRepository buyerSignupApplicationRepository;
    private final HealthBoxBuyerMemberRepository buyerMemberRepository;
    private final HealthBoxBuyerAddressRepository buyerAddressRepository;
    private final HealthBoxBuyerCartItemRepository buyerCartItemRepository;
    private final PasswordEncoder passwordEncoder;
    private final HealthBoxAccountRepository accountRepository;
    private final HealthBoxAccountRoleRepository accountRoleRepository;
    private final HealthBoxCategoryRepository categoryRepository;
    private final HealthBoxPublicSiteConfigRepository publicSiteConfigRepository;
    private final HealthBoxDealerMallPublicConfigRepository dealerMallPublicConfigRepository;
    private final HealthBoxProductRepository productRepository;
    private final HealthBoxProductMediaRepository productMediaRepository;
    private final HealthBoxProductOptionGroupRepository productOptionGroupRepository;
    private final HealthBoxProductOptionValueRepository productOptionValueRepository;
    private final HealthBoxProductSkuRepository productSkuRepository;
    private final HealthBoxProductSkuOptionRepository productSkuOptionRepository;
    private final HealthBoxSalesPolicyRepository salesPolicyRepository;
    private final HealthBoxDeliveryPolicyRepository deliveryPolicyRepository;
    private final HealthBoxNoticeRepository noticeRepository;
    private final HealthBoxProductInquiryRepository productInquiryRepository;
    private final HealthBoxOrderRepository orderRepository;
    private final HealthBoxOrderItemRepository orderItemRepository;
    private final HealthBoxPaymentRepository paymentRepository;
    private final HealthBoxPaymentCancelRequestRepository paymentCancelRequestRepository;
    private final HealthBoxPaymentService paymentService;
    private final HealthBoxShipmentRepository shipmentRepository;
    private final HealthBoxShipmentItemRepository shipmentItemRepository;
    private final HealthBoxMonthlySalesSummaryRepository monthlySalesSummaryRepository;
    private final HealthBoxMonthlySettlementSummaryRepository monthlySettlementSummaryRepository;

    public HealthBoxService(
        HealthBoxDealerMallRepository dealerMallRepository,
        HealthBoxDealerApplicationRepository dealerApplicationRepository,
        HealthBoxBuyerSignupApplicationRepository buyerSignupApplicationRepository,
        HealthBoxBuyerMemberRepository buyerMemberRepository,
        HealthBoxBuyerAddressRepository buyerAddressRepository,
        HealthBoxBuyerCartItemRepository buyerCartItemRepository,
        PasswordEncoder passwordEncoder,
        HealthBoxAccountRepository accountRepository,
        HealthBoxAccountRoleRepository accountRoleRepository,
        HealthBoxCategoryRepository categoryRepository,
        HealthBoxPublicSiteConfigRepository publicSiteConfigRepository,
        HealthBoxDealerMallPublicConfigRepository dealerMallPublicConfigRepository,
        HealthBoxProductRepository productRepository,
        HealthBoxProductMediaRepository productMediaRepository,
        HealthBoxProductOptionGroupRepository productOptionGroupRepository,
        HealthBoxProductOptionValueRepository productOptionValueRepository,
        HealthBoxProductSkuRepository productSkuRepository,
        HealthBoxProductSkuOptionRepository productSkuOptionRepository,
        HealthBoxSalesPolicyRepository salesPolicyRepository,
        HealthBoxDeliveryPolicyRepository deliveryPolicyRepository,
        HealthBoxNoticeRepository noticeRepository,
        HealthBoxProductInquiryRepository productInquiryRepository,
        HealthBoxOrderRepository orderRepository,
        HealthBoxOrderItemRepository orderItemRepository,
        HealthBoxPaymentRepository paymentRepository,
        HealthBoxPaymentCancelRequestRepository paymentCancelRequestRepository,
        HealthBoxPaymentService paymentService,
        HealthBoxShipmentRepository shipmentRepository,
        HealthBoxShipmentItemRepository shipmentItemRepository,
        HealthBoxMonthlySalesSummaryRepository monthlySalesSummaryRepository,
        HealthBoxMonthlySettlementSummaryRepository monthlySettlementSummaryRepository
    ) {
        this.dealerMallRepository = dealerMallRepository;
        this.dealerApplicationRepository = dealerApplicationRepository;
        this.buyerSignupApplicationRepository = buyerSignupApplicationRepository;
        this.buyerMemberRepository = buyerMemberRepository;
        this.buyerAddressRepository = buyerAddressRepository;
        this.buyerCartItemRepository = buyerCartItemRepository;
        this.passwordEncoder = passwordEncoder;
        this.accountRepository = accountRepository;
        this.accountRoleRepository = accountRoleRepository;
        this.categoryRepository = categoryRepository;
        this.publicSiteConfigRepository = publicSiteConfigRepository;
        this.dealerMallPublicConfigRepository = dealerMallPublicConfigRepository;
        this.productRepository = productRepository;
        this.productMediaRepository = productMediaRepository;
        this.productOptionGroupRepository = productOptionGroupRepository;
        this.productOptionValueRepository = productOptionValueRepository;
        this.productSkuRepository = productSkuRepository;
        this.productSkuOptionRepository = productSkuOptionRepository;
        this.salesPolicyRepository = salesPolicyRepository;
        this.deliveryPolicyRepository = deliveryPolicyRepository;
        this.noticeRepository = noticeRepository;
        this.productInquiryRepository = productInquiryRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.paymentRepository = paymentRepository;
        this.paymentCancelRequestRepository = paymentCancelRequestRepository;
        this.paymentService = paymentService;
        this.shipmentRepository = shipmentRepository;
        this.shipmentItemRepository = shipmentItemRepository;
        this.monthlySalesSummaryRepository = monthlySalesSummaryRepository;
        this.monthlySettlementSummaryRepository = monthlySettlementSummaryRepository;
    }

    public HealthBoxDealerContextResponse resolveDealerMallByHost(String host) {
        HealthBoxDealerContextResponse response = new HealthBoxDealerContextResponse();
        String normalizedHost = normalizeHost(host);
        response.setHost(normalizedHost);

        if (!StringUtils.hasText(normalizedHost)) {
            response.setValid(false);
            response.setReason("host is empty");
            return response;
        }

        if ("admin.everybuy.co.kr".equals(normalizedHost)) {
            response.setValid(true);
            response.setAppType("ADMIN");
            return response;
        }

        if (isHqMallHost(normalizedHost)) {
            response.setValid(true);
            response.setAppType("HQ_PUBLIC");
            return response;
        }

        if (!normalizedHost.endsWith(ROOT_DOMAIN)) {
            response.setValid(false);
            response.setReason("unsupported domain");
            return response;
        }

        String slug = normalizedHost.substring(0, normalizedHost.length() - ROOT_DOMAIN.length());
        if (!StringUtils.hasText(slug)) {
            response.setValid(false);
            response.setReason("subdomain is missing");
            return response;
        }

        if (slug.contains(".")) {
            response.setValid(false);
            response.setReason("only one subdomain level is allowed");
            return response;
        }

        if ("admin".equals(slug) || "www".equals(slug)) {
            response.setValid(false);
            response.setReason("reserved subdomain");
            return response;
        }

        response.setSlug(slug);
        response.setAppType("DEALER_PUBLIC");

        HealthBoxDealerMallVo dealerMall = dealerMallRepository.findBySlug(slug).orElse(null);
        if (dealerMall == null) {
            response.setValid(false);
            response.setReason("dealer mall not found");
            return response;
        }

        if (!"ACTIVE".equalsIgnoreCase(dealerMall.getStatus()) && !"APPROVED".equalsIgnoreCase(dealerMall.getStatus())) {
            response.setValid(false);
            response.setReason("dealer mall is inactive");
            return response;
        }

        HealthBoxDealerMallPublicConfigVo config = dealerMallPublicConfigRepository.findByDealerMallId(dealerMall.getId()).orElse(null);
        if (config == null) {
            response.setValid(false);
            response.setReason("dealer mall public config not found");
            return response;
        }

        if (!"Y".equalsIgnoreCase(config.getActiveYn())) {
            response.setValid(false);
            response.setReason("dealer mall public config is inactive");
            return response;
        }

        response.setValid(true);
        response.setDealerMallId(dealerMall.getId());
        response.setMallName(coalesce(config.getMallName(), dealerMall.getMallName()));
        response.setDisplayName(coalesce(config.getDisplayName(), dealerMall.getDisplayName()));
        response.setSupportEmail(coalesce(config.getSupportEmail(), dealerMall.getSupportEmail()));
        response.setSupportPhone(coalesce(config.getSupportPhone(), dealerMall.getSupportPhone()));
        return response;
    }

    public HealthBoxDealerPublicResponse getDealerMallBySlug(String slug) {
        DealerPublicView dealerPublicView = getActiveDealerPublicViewBySlug(slug);
        return toDealerPublicResponse(dealerPublicView.getDealerMall(), dealerPublicView.getPublicConfig());
    }

    @Transactional
    public HealthBoxDealerMallVo createDealerMallManually(HealthBoxAdminDealerCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("dealer create request is required");
        }

        validateManualDealerRequest(request);

        String normalizedSlug = normalizeSlug(request.getSlug());
        validateDealerSlug(normalizedSlug);
        if (dealerMallRepository.existsBySlug(normalizedSlug)) {
            throw new IllegalArgumentException("dealer mall slug already exists. slug=" + normalizedSlug);
        }

        HealthBoxDealerApplicationVo pseudoApplication = new HealthBoxDealerApplicationVo();
        pseudoApplication.setApplicantName(request.getApplicantName().trim());
        pseudoApplication.setPhone(request.getPhone());
        pseudoApplication.setEmail(request.getEmail());
        pseudoApplication.setWantedMallName(request.getMallName().trim());
        pseudoApplication.setWantedSlug(normalizedSlug);
        pseudoApplication.setReviewMemo(request.getReviewMemo());

        LocalDateTime now = LocalDateTime.now();
        HealthBoxDealerMallVo dealerMall = new HealthBoxDealerMallVo();
        dealerMall.setHqId(DEFAULT_HQ_ID);
        dealerMall.setMallName(request.getMallName().trim());
        dealerMall.setDisplayName(StringUtils.hasText(request.getDisplayName()) ? request.getDisplayName().trim() : request.getMallName().trim());
        dealerMall.setSlug(normalizedSlug);
        dealerMall.setDealerCode(generateManualDealerCode(normalizedSlug));
        dealerMall.setStatus("ACTIVE");
        dealerMall.setApprovedAt(now);
        dealerMall.setJoinedAt(now);
        dealerMall.setRepresentativePhone(normalizePhone(request.getPhone()));
        dealerMall.setSupportEmail(normalizeEmail(request.getEmail()));
        dealerMall.setSupportPhone(normalizePhone(request.getPhone()));
        dealerMall = dealerMallRepository.save(dealerMall);

        HealthBoxDealerMallPublicConfigVo publicConfig = new HealthBoxDealerMallPublicConfigVo();
        publicConfig.setDealerMallId(dealerMall.getId());
        publicConfig.setSlug(normalizedSlug);
        publicConfig.setMallName(dealerMall.getMallName());
        publicConfig.setDisplayName(dealerMall.getDisplayName());
        publicConfig.setSupportEmail(dealerMall.getSupportEmail());
        publicConfig.setSupportPhone(dealerMall.getSupportPhone());
        publicConfig.setActiveYn("Y");
        dealerMallPublicConfigRepository.save(publicConfig);

        HealthBoxAccountVo dealerAdminAccount = resolveOrCreateDealerAdminAccount(pseudoApplication);
        ensureDealerAdminRole(dealerAdminAccount.getId(), dealerMall.getId());

        return dealerMall;
    }

    @Transactional
    public HealthBoxDealerApplicationVo createDealerApplication(HealthBoxDealerApplicationCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("dealer application request is required");
        }

        String applicantName = request.getApplicantName() == null ? "" : request.getApplicantName().trim();
        String normalizedPhone = normalizePhone(request.getPhone());
        String normalizedEmail = normalizeEmail(request.getEmail());
        String businessInfo = request.getBusinessInfo() == null ? "" : request.getBusinessInfo().trim();
        String wantedMallName = request.getWantedMallName() == null ? "" : request.getWantedMallName().trim();
        String wantedSlug = normalizeSlug(request.getWantedSlug());

        if (!StringUtils.hasText(applicantName) || applicantName.length() > 100) {
            throw new IllegalArgumentException("applicantName is required and must be 100 characters or fewer");
        }
        if (!StringUtils.hasText(normalizedPhone) || !normalizedPhone.matches("^[0-9]{9,11}$")) {
            throw new IllegalArgumentException("valid phone is required");
        }
        if (!StringUtils.hasText(normalizedEmail) ||
            normalizedEmail.length() > 150 ||
            !normalizedEmail.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new IllegalArgumentException("valid email is required");
        }
        if (businessInfo.length() < 10 || businessInfo.length() > 1000) {
            throw new IllegalArgumentException("businessInfo must be between 10 and 1000 characters");
        }
        if (!StringUtils.hasText(wantedMallName) || wantedMallName.length() > 150) {
            throw new IllegalArgumentException("wantedMallName is required and must be 150 characters or fewer");
        }
        if (wantedSlug == null || wantedSlug.length() < 3 || wantedSlug.length() > 40 ||
            wantedSlug.startsWith("-") || wantedSlug.endsWith("-")) {
            throw new IllegalArgumentException("wantedSlug must be between 3 and 40 characters");
        }
        validateDealerSlug(wantedSlug);
        if (!Boolean.TRUE.equals(request.getPrivacyAgreed()) ||
            !DEALER_APPLICATION_CONSENT_VERSION.equals(request.getConsentDocumentVersion())) {
            throw new IllegalArgumentException("privacy consent is required");
        }
        if (dealerMallRepository.existsBySlug(wantedSlug)) {
            throw new IllegalArgumentException("dealer mall slug already exists. slug=" + wantedSlug);
        }

        HealthBoxDealerApplicationVo matchingIdentity = null;
        for (HealthBoxDealerApplicationVo pending : dealerApplicationRepository.findByStatusIgnoreCaseOrderByIdDesc("PENDING")) {
            String pendingPhone = normalizePhone(pending.getPhone());
            String pendingEmail = normalizeEmail(pending.getEmail());
            boolean sameIdentity = normalizedPhone.equals(pendingPhone) || normalizedEmail.equalsIgnoreCase(pendingEmail);
            String pendingSlug = normalizeSlug(pending.getWantedSlug());

            if (wantedSlug.equals(pendingSlug) && !sameIdentity) {
                throw new IllegalArgumentException("dealer mall slug already has a pending application. slug=" + wantedSlug);
            }
            if (sameIdentity && matchingIdentity == null) {
                matchingIdentity = pending;
            }
        }

        HealthBoxDealerApplicationVo application = matchingIdentity != null
            ? matchingIdentity
            : new HealthBoxDealerApplicationVo();
        application.setApplicantName(applicantName);
        application.setPhone(normalizedPhone);
        application.setEmail(normalizedEmail);
        application.setBusinessInfo(businessInfo);
        application.setWantedMallName(wantedMallName);
        application.setWantedSlug(wantedSlug);
        application.setStatus("PENDING");
        application.setDealerMallId(null);
        application.setApprovedAt(null);
        application.setRejectReason(null);
        application.setReviewMemo(null);
        application.setPrivacyAgreedAt(LocalDateTime.now());
        application.setConsentDocumentVersion(DEALER_APPLICATION_CONSENT_VERSION);
        return dealerApplicationRepository.save(application);
    }

    @Transactional
    public HealthBoxBuyerSignupApplicationVo createBuyerSignupApplication(HealthBoxBuyerSignupCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("buyer signup request is required");
        }

        boolean hqMallSignup = isHqMallSignup(request);
        HealthBoxDealerMallVo dealerMall = hqMallSignup ? null : resolveActiveDealerMallForSignup(request);
        Long signupDealerMallId = hqMallSignup ? HQ_BUYER_DEALER_MALL_ID : dealerMall.getId();
        String normalizedPhone = normalizePhone(request.getPhone());
        String normalizedEmail = normalizeEmail(request.getEmail());

        validateApprovalIdentity(normalizedEmail, normalizedPhone, "buyer signup request");
        if (!StringUtils.hasText(request.getName())) {
            throw new IllegalArgumentException("name is required");
        }
        validateBuyerPassword(request.getPassword());
        validateBuyerSignupConsent(request);

        LocalDateTime consentedAt = LocalDateTime.now();
        HealthBoxBuyerSignupApplicationVo identity = new HealthBoxBuyerSignupApplicationVo();
        identity.setDealerMallId(signupDealerMallId);
        identity.setPhone(normalizedPhone);
        identity.setEmail(normalizedEmail);
        HealthBoxBuyerMemberVo existingBuyerMember = findExistingBuyerMember(identity);
        if (existingBuyerMember != null) {
            throw new IllegalArgumentException(duplicateBuyerIdentityMessage(existingBuyerMember, normalizedEmail));
        }

        HealthBoxBuyerSignupApplicationVo existingPending = findExistingPendingBuyerSignupApplication(signupDealerMallId, normalizedPhone, normalizedEmail);
        if (existingPending != null) {
            existingPending.setName(request.getName().trim());
            existingPending.setPhone(normalizedPhone);
            existingPending.setEmail(normalizedEmail);
            existingPending.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            existingPending.setInboundChannel(coalesce(request.getInboundChannel(), existingPending.getInboundChannel()));
            existingPending.setDealerMallId(signupDealerMallId);
            existingPending.setStatus("PENDING");
            existingPending.setRejectReason(null);
            applyBuyerSignupConsent(existingPending, request, consentedAt);
            return activateBuyerSignupApplication(buyerSignupApplicationRepository.save(existingPending));
        }

        HealthBoxBuyerSignupApplicationVo application = new HealthBoxBuyerSignupApplicationVo();
        application.setDealerMallId(signupDealerMallId);
        application.setName(request.getName().trim());
        application.setPhone(normalizedPhone);
        application.setEmail(normalizedEmail);
        application.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        application.setStatus("PENDING");
        application.setAppliedAt(consentedAt);
        application.setInboundChannel(StringUtils.hasText(request.getInboundChannel()) ? request.getInboundChannel().trim() : resolveInboundChannel(request));
        applyBuyerSignupConsent(application, request, consentedAt);
        return activateBuyerSignupApplication(buyerSignupApplicationRepository.save(application));
    }

    @Transactional(readOnly = true)
    public HealthBoxBuyerSignupAvailabilityResponse getBuyerSignupAvailability(
        HealthBoxBuyerSignupAvailabilityRequest request
    ) {
        if (request == null) {
            throw new IllegalArgumentException("buyer signup availability request is required");
        }

        boolean hqMallSignup = Boolean.TRUE.equals(request.getHqMall())
            || Long.valueOf(HQ_BUYER_DEALER_MALL_ID).equals(request.getDealerMallId());
        Long dealerMallId;
        if (hqMallSignup) {
            dealerMallId = HQ_BUYER_DEALER_MALL_ID;
        } else if (request.getDealerMallId() != null && request.getDealerMallId() > 0) {
            HealthBoxDealerMallVo dealerMall = dealerMallRepository.findById(request.getDealerMallId())
                .orElseThrow(() -> new IllegalArgumentException("dealer mall not found. id=" + request.getDealerMallId()));
            validateDealerMallPublicAvailability(dealerMall);
            dealerMallId = dealerMall.getId();
        } else if (StringUtils.hasText(request.getSlug())) {
            dealerMallId = getActiveDealerPublicViewBySlug(request.getSlug()).getDealerMall().getId();
        } else {
            throw new IllegalArgumentException("dealerMallId or slug is required");
        }

        boolean phoneType = "phone".equalsIgnoreCase(request.getType());
        String value = phoneType ? normalizePhone(request.getValue()) : normalizeEmail(request.getValue());
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException(phoneType ? "phone is required" : "email is required");
        }

        HealthBoxBuyerMemberVo existingBuyerMember = phoneType
            ? buyerMemberRepository.findByDealerMallIdAndPhone(dealerMallId, value).orElse(null)
            : buyerMemberRepository.findByDealerMallIdAndEmail(dealerMallId, value).orElse(null);
        if (existingBuyerMember != null) {
            return new HealthBoxBuyerSignupAvailabilityResponse(
                false,
                phoneType ? "이미 가입된 휴대폰 번호입니다." : "이미 가입된 이메일입니다."
            );
        }

        return new HealthBoxBuyerSignupAvailabilityResponse(
            true,
            phoneType ? "사용 가능한 휴대폰 번호입니다." : "사용 가능한 이메일입니다."
        );
    }

    public HealthBoxBuyerLoginResponse loginBuyer(HealthBoxBuyerLoginRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("buyer login request is required");
        }
        if (!StringUtils.hasText(request.getLoginId()) || !StringUtils.hasText(request.getPassword())) {
            throw new IllegalArgumentException("loginId and password are required");
        }

        boolean hqMallLogin = isHqMallLogin(request);
        HealthBoxDealerMallVo dealerMall = hqMallLogin ? null : resolveActiveDealerMallForLogin(request);
        HealthBoxBuyerMemberVo buyerMember = findBuyerMemberForLogin(
            hqMallLogin ? HQ_BUYER_DEALER_MALL_ID : dealerMall.getId(),
            request.getLoginId()
        );
        if (buyerMember == null || !"ACTIVE".equalsIgnoreCase(buyerMember.getStatus())) {
            throw new IllegalArgumentException("buyer member not found for dealer mall");
        }

        HealthBoxAccountVo account = buyerMember.getAccountId() != null
            ? accountRepository.findById(buyerMember.getAccountId()).orElse(null)
            : null;
        if (account == null || !"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new IllegalArgumentException("invalid buyer login credentials");
        }
        if (!isBuyerPasswordAccepted(account, request.getPassword())) {
            throw new IllegalArgumentException("invalid buyer login credentials");
        }

        if (hqMallLogin && buyerMember.getDealerMallId() != HQ_BUYER_DEALER_MALL_ID) {
            dealerMall = dealerMallRepository.findById(buyerMember.getDealerMallId())
                .orElseThrow(() -> new IllegalArgumentException("dealer mall not found. id=" + buyerMember.getDealerMallId()));
            validateDealerMallPublicAvailability(dealerMall);
        }

        account.setSessionToken(UUID.randomUUID().toString());
        account.setSessionExpiredAt(LocalDateTime.now().plusDays(30));
        account.setLastLoginAt(LocalDateTime.now());
        accountRepository.save(account);

        DealerPublicView dealerPublicView = dealerMall != null ? getActiveDealerPublicViewBySlug(dealerMall.getSlug()) : null;
        HealthBoxBuyerLoginResponse response = new HealthBoxBuyerLoginResponse();
        response.setAccountId(account.getId());
        response.setSessionToken(account.getSessionToken());
        response.setBuyerMemberId(buyerMember.getId());
        response.setDealerMallId(hqMallLogin ? HQ_BUYER_DEALER_MALL_ID : dealerMall.getId());
        response.setSlug(dealerMall != null ? dealerMall.getSlug() : null);
        response.setMallName(dealerMall != null ? coalesce(dealerPublicView.getPublicConfig().getMallName(), dealerMall.getMallName()) : "본사몰");
        response.setDisplayName(dealerMall != null ? coalesce(dealerPublicView.getPublicConfig().getDisplayName(), dealerMall.getDisplayName()) : "본사몰");
        response.setHqMall(hqMallLogin);
        response.setName(buyerMember.getName());
        response.setPhone(buyerMember.getPhone());
        response.setEmail(buyerMember.getEmail());
        response.setStatus(buyerMember.getStatus());
        return response;
    }

    @Transactional
    public void resetBuyerPassword(HealthBoxBuyerPasswordResetRequest request) {
        HealthBoxBuyerMemberVo buyerMember = resolveVerifiedPasswordResetBuyerMember(request);
        validateBuyerPassword(request.getNewPassword());

        HealthBoxAccountVo account = resolvePasswordResetAccount(buyerMember);

        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        account.setSessionToken(null);
        account.setSessionExpiredAt(null);
        accountRepository.save(account);
    }

    @Transactional(readOnly = true)
    public void verifyBuyerPasswordResetIdentity(HealthBoxBuyerPasswordResetRequest request) {
        HealthBoxBuyerMemberVo buyerMember = resolveVerifiedPasswordResetBuyerMember(request);
        resolvePasswordResetAccount(buyerMember);
    }

    private HealthBoxBuyerMemberVo resolveVerifiedPasswordResetBuyerMember(HealthBoxBuyerPasswordResetRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("buyer password reset request is required");
        }
        if (!StringUtils.hasText(request.getName())) {
            throw new IllegalArgumentException("name is required");
        }

        String normalizedPhone = normalizePhone(request.getPhone());
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (!StringUtils.hasText(normalizedPhone) && !StringUtils.hasText(normalizedEmail)) {
            throw new IllegalArgumentException("phone or email is required");
        }

        boolean hqMallReset = isHqMallPasswordReset(request);
        HealthBoxDealerMallVo dealerMall = hqMallReset ? null : resolveActiveDealerMallForPasswordReset(request);
        HealthBoxBuyerMemberVo buyerMember = resolvePasswordResetBuyerMember(
            dealerMall,
            hqMallReset,
            request.getName().trim(),
            normalizedPhone,
            normalizedEmail
        );

        if (buyerMember == null || !"ACTIVE".equalsIgnoreCase(buyerMember.getStatus())) {
            throw new IllegalArgumentException("buyer member not found");
        }

        if (!request.getName().trim().equals(buyerMember.getName())) {
            throw new IllegalArgumentException("buyer identity does not match");
        }
        if (StringUtils.hasText(normalizedPhone) && !normalizedPhone.equals(normalizePhone(buyerMember.getPhone()))) {
            throw new IllegalArgumentException("buyer identity does not match");
        }
        if (StringUtils.hasText(normalizedEmail) && !normalizedEmail.equalsIgnoreCase(normalizeEmail(buyerMember.getEmail()))) {
            throw new IllegalArgumentException("buyer identity does not match");
        }

        return buyerMember;
    }

    @Transactional
    public HealthBoxDealerApplicationVo approveDealerApplication(Long applicationId, HealthBoxApprovalRequest request) {
        HealthBoxDealerApplicationVo application = dealerApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new IllegalArgumentException("dealer application not found. id=" + applicationId));

        if ("APPROVED".equalsIgnoreCase(application.getStatus())) {
            return application;
        }
        if (!"PENDING".equalsIgnoreCase(application.getStatus())) {
            throw new IllegalArgumentException("dealer application is not pending. id=" + applicationId);
        }

        validateApprovalIdentity(normalizeEmail(application.getEmail()), normalizePhone(application.getPhone()), "dealer application");

        String slug = normalizeSlug(application.getWantedSlug());
        validateDealerSlug(slug);
        if (dealerMallRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("dealer mall slug already exists. slug=" + slug);
        }

        LocalDateTime now = LocalDateTime.now();
        HealthBoxDealerMallVo dealerMall = new HealthBoxDealerMallVo();
        dealerMall.setHqId(DEFAULT_HQ_ID);
        dealerMall.setMallName(application.getWantedMallName());
        dealerMall.setDisplayName(application.getWantedMallName());
        dealerMall.setSlug(slug);
        dealerMall.setDealerCode(generateDealerCode(application.getId()));
        dealerMall.setStatus("ACTIVE");
        dealerMall.setApprovedAt(now);
        dealerMall.setJoinedAt(now);
        dealerMall.setRepresentativePhone(normalizePhone(application.getPhone()));
        dealerMall.setSupportEmail(normalizeEmail(application.getEmail()));
        dealerMall.setSupportPhone(normalizePhone(application.getPhone()));
        dealerMall = dealerMallRepository.save(dealerMall);

        HealthBoxDealerMallPublicConfigVo publicConfig = new HealthBoxDealerMallPublicConfigVo();
        publicConfig.setDealerMallId(dealerMall.getId());
        publicConfig.setSlug(slug);
        publicConfig.setMallName(dealerMall.getMallName());
        publicConfig.setDisplayName(dealerMall.getDisplayName());
        publicConfig.setSupportEmail(dealerMall.getSupportEmail());
        publicConfig.setSupportPhone(dealerMall.getSupportPhone());
        publicConfig.setActiveYn("Y");
        dealerMallPublicConfigRepository.save(publicConfig);

        HealthBoxAccountVo dealerAdminAccount = resolveOrCreateDealerAdminAccount(application);
        ensureDealerAdminRole(dealerAdminAccount.getId(), dealerMall.getId());

        application.setStatus("APPROVED");
        application.setApprovedAt(now);
        application.setDealerMallId(dealerMall.getId());
        application.setWantedSlug(slug);
        application.setReviewMemo(request != null ? request.getReviewMemo() : null);
        return dealerApplicationRepository.save(application);
    }

    @Transactional
    public HealthBoxDealerApplicationVo rejectDealerApplication(Long applicationId, HealthBoxRejectRequest request) {
        HealthBoxDealerApplicationVo application = dealerApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new IllegalArgumentException("dealer application not found. id=" + applicationId));

        if ("APPROVED".equalsIgnoreCase(application.getStatus())) {
            throw new IllegalArgumentException("approved dealer application cannot be rejected. id=" + applicationId);
        }
        if (!"PENDING".equalsIgnoreCase(application.getStatus()) && !"REJECTED".equalsIgnoreCase(application.getStatus())) {
            throw new IllegalArgumentException("dealer application is not pending. id=" + applicationId);
        }

        application.setStatus("REJECTED");
        application.setRejectReason(request != null ? request.getRejectReason() : null);
        application.setReviewMemo(request != null ? request.getReviewMemo() : null);
        return dealerApplicationRepository.save(application);
    }

    @Transactional
    public HealthBoxBuyerSignupApplicationVo approveBuyerSignupApplication(Long applicationId, HealthBoxApprovalRequest request) {
        HealthBoxBuyerSignupApplicationVo application = buyerSignupApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new IllegalArgumentException("buyer signup application not found. id=" + applicationId));

        if ("APPROVED".equalsIgnoreCase(application.getStatus())) {
            return application;
        }

        return activateBuyerSignupApplication(application);
    }

    private HealthBoxBuyerSignupApplicationVo activateBuyerSignupApplication(HealthBoxBuyerSignupApplicationVo application) {

        validateApprovalIdentity(normalizeEmail(application.getEmail()), normalizePhone(application.getPhone()), "buyer signup application");

        if (application.getDealerMallId() == null) {
            throw new IllegalArgumentException("dealerMallId is required for buyer signup approval");
        }

        boolean hqMallSignup = isHqBuyerApplication(application);
        HealthBoxDealerMallVo dealerMall = hqMallSignup ? null : dealerMallRepository.findById(application.getDealerMallId())
            .orElseThrow(() -> new IllegalArgumentException("dealer mall not found. id=" + application.getDealerMallId()));

        HealthBoxBuyerMemberVo existingBuyerMember = findExistingBuyerMember(application);
        if (existingBuyerMember == null && application.getBuyerMemberId() != null) {
            existingBuyerMember = resolveBuyerMemberFromApplication(application);
        }

        LocalDateTime now = LocalDateTime.now();
        HealthBoxBuyerMemberVo buyerMember = existingBuyerMember;
        if (buyerMember == null) {
            buyerMember = new HealthBoxBuyerMemberVo();
            buyerMember.setDealerMallId(hqMallSignup ? HQ_BUYER_DEALER_MALL_ID : dealerMall.getId());
            buyerMember.setJoinedAt(now);
        }
        buyerMember.setName(application.getName());
        buyerMember.setPhone(normalizePhone(application.getPhone()));
        buyerMember.setEmail(normalizeEmail(application.getEmail()));
        buyerMember.setStatus("ACTIVE");
        buyerMember.setApprovedAt(now);
        buyerMember.setBirthDate(application.getBirthDate());
        buyerMember.setTermsAgreedAt(application.getTermsAgreedAt());
        buyerMember.setPrivacyAgreedAt(application.getPrivacyAgreedAt());
        buyerMember.setThirdPartyAgreedAt(application.getThirdPartyAgreedAt());
        buyerMember.setMarketingConsentYn(application.getMarketingConsentYn());
        buyerMember.setMarketingConsentUpdatedAt(application.getMarketingConsentUpdatedAt());
        buyerMember.setConsentDocumentVersion(application.getConsentDocumentVersion());
        buyerMember.setAccountId(resolveOrCreateBuyerAccount(application, buyerMember));
        buyerMember = buyerMemberRepository.save(buyerMember);

        application.setStatus("APPROVED");
        application.setApprovedAt(now);
        application.setBuyerMemberId(buyerMember.getId());
        application.setRejectReason(null);
        return buyerSignupApplicationRepository.save(application);
    }

    @Transactional
    public HealthBoxBuyerSignupApplicationVo rejectBuyerSignupApplication(Long applicationId, HealthBoxRejectRequest request) {
        HealthBoxBuyerSignupApplicationVo application = buyerSignupApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new IllegalArgumentException("buyer signup application not found. id=" + applicationId));

        application.setStatus("REJECTED");
        application.setRejectReason(request != null ? request.getRejectReason() : null);
        return buyerSignupApplicationRepository.save(application);
    }

    public List<HealthBoxBuyerMemberVo> getBuyerMembersByDealerMall(Long dealerMallId) {
        return buyerMemberRepository.findByDealerMallIdOrderByIdDesc(dealerMallId);
    }

    public HealthBoxBuyerSignupApplicationVo getBuyerSignupApplication(Long applicationId) {
        return buyerSignupApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new IllegalArgumentException("buyer signup application not found. id=" + applicationId));
    }

    public List<HealthBoxBuyerMemberVo> getBuyerMembers() {
        return buyerMemberRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    @Transactional
    public HealthBoxBuyerLoginResponse updateBuyerProfile(Long buyerMemberId, HealthBoxBuyerProfileUpdateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("buyer profile update request is required");
        }
        if (buyerMemberId == null) {
            throw new IllegalArgumentException("buyerMemberId is required");
        }
        if (request.getDealerMallId() == null) {
            throw new IllegalArgumentException("dealerMallId is required");
        }
        if (!StringUtils.hasText(request.getName())) {
            throw new IllegalArgumentException("name is required");
        }

        String normalizedPhone = normalizePhone(request.getPhone());
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (!StringUtils.hasText(normalizedPhone) || !StringUtils.hasText(normalizedEmail)) {
            throw new IllegalArgumentException("phone and email are required");
        }

        HealthBoxBuyerMemberVo buyerMember = validateBuyerAccess(
            buyerMemberId,
            request.getDealerMallId(),
            request.getSessionToken()
        );

        HealthBoxBuyerMemberVo existingByPhone = buyerMemberRepository
            .findByDealerMallIdAndPhone(request.getDealerMallId(), normalizedPhone)
            .orElse(null);
        if (existingByPhone != null && !buyerMember.getId().equals(existingByPhone.getId())) {
            throw new IllegalArgumentException("buyer phone already exists");
        }

        HealthBoxBuyerMemberVo existingByEmail = buyerMemberRepository
            .findByDealerMallIdAndEmail(request.getDealerMallId(), normalizedEmail)
            .orElse(null);
        if (existingByEmail != null && !buyerMember.getId().equals(existingByEmail.getId())) {
            throw new IllegalArgumentException("buyer email already exists");
        }

        HealthBoxAccountVo account = accountRepository.findById(buyerMember.getAccountId())
            .orElseThrow(() -> new IllegalArgumentException("buyer account not found"));
        HealthBoxAccountVo accountByPhone = accountRepository.findByPhone(normalizedPhone).orElse(null);
        if (accountByPhone != null && !account.getId().equals(accountByPhone.getId())) {
            throw new IllegalArgumentException("buyer phone already exists");
        }
        HealthBoxAccountVo accountByEmail = accountRepository.findByEmail(normalizedEmail).orElse(null);
        if (accountByEmail != null && !account.getId().equals(accountByEmail.getId())) {
            throw new IllegalArgumentException("buyer email already exists");
        }

        buyerMember.setName(request.getName().trim());
        buyerMember.setPhone(normalizedPhone);
        buyerMember.setEmail(normalizedEmail);
        buyerMember = buyerMemberRepository.save(buyerMember);

        account.setName(buyerMember.getName());
        account.setPhone(normalizedPhone);
        account.setEmail(normalizedEmail);
        account = accountRepository.save(account);

        Long buyerDealerMallId = buyerMember.getDealerMallId();
        HealthBoxDealerMallVo dealerMall = dealerMallRepository.findById(buyerDealerMallId)
            .orElseThrow(() -> new IllegalArgumentException("dealer mall not found. id=" + buyerDealerMallId));
        DealerPublicView dealerPublicView = getActiveDealerPublicViewBySlug(dealerMall.getSlug());
        HealthBoxBuyerLoginResponse response = new HealthBoxBuyerLoginResponse();
        response.setAccountId(account.getId());
        response.setSessionToken(account.getSessionToken());
        response.setBuyerMemberId(buyerMember.getId());
        response.setDealerMallId(dealerMall.getId());
        response.setSlug(dealerMall.getSlug());
        response.setMallName(coalesce(dealerPublicView.getPublicConfig().getMallName(), dealerMall.getMallName()));
        response.setDisplayName(coalesce(dealerPublicView.getPublicConfig().getDisplayName(), dealerMall.getDisplayName()));
        response.setHqMall(false);
        response.setName(buyerMember.getName());
        response.setPhone(buyerMember.getPhone());
        response.setEmail(buyerMember.getEmail());
        response.setStatus(buyerMember.getStatus());
        return response;
    }

    public List<HealthBoxOrderDetailResponse> getOrdersByDealerMall(Long dealerMallId) {
        return orderRepository.findByDealerMallIdOrderByIdDesc(dealerMallId).stream()
            .map(order -> buildOrderDetailResponse(order))
            .collect(Collectors.toList());
    }

    public List<HealthBoxOrderDetailResponse> getOrders() {
        return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
            .map(order -> buildOrderDetailResponse(order))
            .collect(Collectors.toList());
    }

    public List<HealthBoxProductInquiryResponse> getPublicProductInquiries(
        Long productId,
        Long buyerMemberId,
        Long dealerMallId,
        String sessionToken
    ) {
        validateInquiryProduct(productId);
        HealthBoxBuyerMemberVo viewer = null;
        boolean authenticationRequested = buyerMemberId != null
            || dealerMallId != null
            || StringUtils.hasText(sessionToken);
        if (authenticationRequested) {
            if (buyerMemberId == null || dealerMallId == null || !StringUtils.hasText(sessionToken)) {
                throw new IllegalArgumentException("complete buyer session is required");
            }
            viewer = validateBuyerAccess(buyerMemberId, dealerMallId, sessionToken);
        }

        final HealthBoxBuyerMemberVo authenticatedViewer = viewer;
        return productInquiryRepository.findByProductIdOrderByIdDesc(productId).stream()
            .map(inquiry -> buildProductInquiryResponse(inquiry, authenticatedViewer, false))
            .collect(Collectors.toList());
    }

    public List<HealthBoxProductInquiryResponse> getAdminProductInquiries(Long productId) {
        validateInquiryProduct(productId);
        return productInquiryRepository.findByProductIdOrderByIdDesc(productId).stream()
            .map(inquiry -> buildProductInquiryResponse(inquiry, null, true))
            .collect(Collectors.toList());
    }

    @Transactional
    public HealthBoxProductInquiryResponse createProductInquiry(
        Long productId,
        HealthBoxProductInquiryRequest request
    ) {
        if (request == null) {
            throw new IllegalArgumentException("product inquiry request is required");
        }
        if (request.getProductId() != null && !request.getProductId().equals(productId)) {
            throw new IllegalArgumentException("productId mismatch");
        }
        if (request.getBuyerMemberId() == null || request.getDealerMallId() == null) {
            throw new IllegalArgumentException("buyerMemberId and dealerMallId are required");
        }
        validateInquiryProduct(productId);
        HealthBoxBuyerMemberVo buyerMember = validateBuyerAccess(
            request.getBuyerMemberId(),
            request.getDealerMallId(),
            request.getSessionToken()
        );

        String question = request.getQuestion() != null ? request.getQuestion().trim() : "";
        if (question.length() < 5 || question.length() > 1000) {
            throw new IllegalArgumentException("question must be between 5 and 1000 characters");
        }

        HealthBoxProductInquiryVo inquiry = new HealthBoxProductInquiryVo();
        inquiry.setProductId(productId);
        inquiry.setBuyerMemberId(buyerMember.getId());
        inquiry.setDealerMallId(buyerMember.getDealerMallId());
        inquiry.setQuestion(question);
        inquiry.setPrivateYn("Y".equalsIgnoreCase(request.getPrivateYn()) ? "Y" : "N");
        inquiry.setStatus("PENDING");
        inquiry = productInquiryRepository.save(inquiry);
        return buildProductInquiryResponse(inquiry, buyerMember, false);
    }

    @Transactional
    public HealthBoxProductInquiryResponse answerProductInquiry(
        Long inquiryId,
        HealthBoxProductInquiryAnswerRequest request
    ) {
        if (request == null) {
            throw new IllegalArgumentException("product inquiry answer request is required");
        }
        String answer = request.getAnswer() != null ? request.getAnswer().trim() : "";
        if (answer.length() < 2 || answer.length() > 2000) {
            throw new IllegalArgumentException("answer must be between 2 and 2000 characters");
        }

        HealthBoxProductInquiryVo inquiry = productInquiryRepository.findById(inquiryId)
            .orElseThrow(() -> new IllegalArgumentException("product inquiry not found. id=" + inquiryId));
        inquiry.setAnswer(answer);
        inquiry.setStatus("ANSWERED");
        inquiry.setAnsweredAt(LocalDateTime.now());
        inquiry = productInquiryRepository.save(inquiry);
        return buildProductInquiryResponse(inquiry, null, true);
    }

    public List<HealthBoxBuyerAddressResponse> getBuyerAddresses(Long buyerMemberId, Long dealerMallId, String sessionToken) {
        validateBuyerAccess(buyerMemberId, dealerMallId, sessionToken);
        return buyerAddressRepository.findByBuyerMemberIdOrderByIdDesc(buyerMemberId).stream()
            .map(this::buildBuyerAddressResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public HealthBoxBuyerAddressResponse createBuyerAddress(Long buyerMemberId, HealthBoxBuyerAddressRequest request) {
        HealthBoxBuyerMemberVo buyerMember = validateBuyerAccess(buyerMemberId, request.getDealerMallId(), request.getSessionToken());
        validateBuyerAddressRequest(request);

        HealthBoxBuyerAddressVo address = new HealthBoxBuyerAddressVo();
        address.setBuyerMemberId(buyerMember.getId());
        applyBuyerAddressRequest(address, request);

        List<HealthBoxBuyerAddressVo> existingAddresses = buyerAddressRepository.findByBuyerMemberIdOrderByIdDesc(buyerMember.getId());
        if (existingAddresses.isEmpty() || "Y".equalsIgnoreCase(request.getDefaultYn())) {
            clearDefaultBuyerAddresses(buyerMember.getId(), null);
            address.setDefaultYn("Y");
        }

        return buildBuyerAddressResponse(buyerAddressRepository.save(address));
    }

    @Transactional
    public HealthBoxBuyerAddressResponse updateBuyerAddress(Long buyerMemberId, Long addressId, HealthBoxBuyerAddressRequest request) {
        validateBuyerAccess(buyerMemberId, request.getDealerMallId(), request.getSessionToken());
        validateBuyerAddressRequest(request);

        HealthBoxBuyerAddressVo address = buyerAddressRepository.findByIdAndBuyerMemberId(addressId, buyerMemberId)
            .orElseThrow(() -> new IllegalArgumentException("buyer address not found. id=" + addressId));
        applyBuyerAddressRequest(address, request);

        if ("Y".equalsIgnoreCase(request.getDefaultYn())) {
            clearDefaultBuyerAddresses(buyerMemberId, addressId);
            address.setDefaultYn("Y");
        }

        return buildBuyerAddressResponse(buyerAddressRepository.save(address));
    }

    @Transactional
    public void deleteBuyerAddress(Long buyerMemberId, Long addressId, Long dealerMallId, String sessionToken) {
        validateBuyerAccess(buyerMemberId, dealerMallId, sessionToken);

        HealthBoxBuyerAddressVo address = buyerAddressRepository.findByIdAndBuyerMemberId(addressId, buyerMemberId)
            .orElseThrow(() -> new IllegalArgumentException("buyer address not found. id=" + addressId));
        boolean wasDefault = "Y".equalsIgnoreCase(address.getDefaultYn());
        buyerAddressRepository.delete(address);

        if (wasDefault) {
            List<HealthBoxBuyerAddressVo> remainingAddresses = buyerAddressRepository.findByBuyerMemberIdOrderByIdDesc(buyerMemberId);
            if (!remainingAddresses.isEmpty()) {
                HealthBoxBuyerAddressVo nextDefault = remainingAddresses.get(0);
                nextDefault.setDefaultYn("Y");
                buyerAddressRepository.save(nextDefault);
            }
        }
    }

    @Transactional
    public HealthBoxOrderDetailResponse createOrder(HealthBoxOrderCreateRequest request) {
        validateOrderRequestForBuyer(request);
        if (!StringUtils.hasText(request.getOrdererName())) {
            throw new IllegalArgumentException("ordererName is required");
        }
        if (!StringUtils.hasText(request.getOrdererPhone())) {
            throw new IllegalArgumentException("ordererPhone is required");
        }

        HealthBoxBuyerMemberVo buyerMember = validateBuyerAccess(
            request.getBuyerMemberId(),
            request.getDealerMallId(),
            request.getSessionToken()
        );

        HealthBoxOrderDetailResponse existingOrder = findExistingOrderForPayment(request, buyerMember);
        if (existingOrder != null) {
            return existingOrder;
        }

        HealthBoxBuyerAddressVo buyerAddress = resolveOrderAddress(request, buyerMember);
        String shippingZipCode = buyerAddress.getZipCode();

        int verifiedProductAmount = calculateOrderItemsAmount(request.getItems());
        CommerceAmounts verifiedCommerceAmounts = resolveCommerceAmounts(
            verifiedProductAmount,
            shippingZipCode,
            request.getDealerMallId()
        );
        validateRequestedCommerceAmounts(request, verifiedCommerceAmounts);
        validateConfirmedTossPayment(request, verifiedCommerceAmounts.totalPaymentAmount);

        HealthBoxDealerMallVo dealerMall = dealerMallRepository.findById(request.getDealerMallId())
            .orElseThrow(() -> new IllegalArgumentException("dealer mall not found. id=" + request.getDealerMallId()));

        List<HealthBoxOrderItemVo> savedItems = new ArrayList<>();
        int productAmount = 0;

        HealthBoxOrderVo order = new HealthBoxOrderVo();
        order.setBuyerMemberId(buyerMember.getId());
        order.setDealerMallId(dealerMall.getId());
        order.setDealerSlugSnapshot(dealerMall.getSlug());
        order.setDealerNameSnapshot(dealerMall.getMallName());
        order.setOrdererName(request.getOrdererName().trim());
        order.setOrdererPhone(normalizePhone(request.getOrdererPhone()));
        order.setReceiverName(buyerAddress.getReceiverName());
        order.setReceiverPhone(normalizePhone(buyerAddress.getReceiverPhone()));
        order.setZipCode(buyerAddress.getZipCode());
        order.setBaseAddress(buyerAddress.getBaseAddress());
        order.setDetailAddress(buyerAddress.getDetailAddress());
        order.setPaymentStatus(StringUtils.hasText(request.getPaymentStatus()) ? request.getPaymentStatus().trim() : "PAID");
        order.setOrderStatus(StringUtils.hasText(request.getOrderStatus()) ? request.getOrderStatus().trim() : "ORDERED");
        order.setOrderedAt(LocalDateTime.now());
        order.setProductAmount(0);
        order.setShippingFee(0);
        order.setDiscountAmount(0);
        order.setTotalPaymentAmount(0);
        order.setRemainingPaymentAmount(0);
        order.setCanceledPaymentAmount(0);
        order.setOrderNo("TMP-" + UUID.randomUUID());
        order = orderRepository.save(order);
        order.setOrderNo(generateOrderNo(order.getOrderedAt()));
        order = orderRepository.save(order);

        for (HealthBoxOrderCreateItemRequest itemRequest : request.getItems()) {
            if (itemRequest == null || itemRequest.getSkuId() == null || itemRequest.getQuantity() == null || itemRequest.getQuantity() <= 0) {
                throw new IllegalArgumentException("valid skuId and quantity are required");
            }

            HealthBoxProductSkuVo sku = productSkuRepository.findWithLockById(itemRequest.getSkuId())
                .orElseThrow(() -> new IllegalArgumentException("sku not found. id=" + itemRequest.getSkuId()));
            HealthBoxProductVo product = productRepository.findById(sku.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("product not found for sku. productId=" + sku.getProductId()));

            validateOrderableSku(product, sku, itemRequest.getQuantity());

            int stockQuantity = sku.getStockQuantity() != null ? sku.getStockQuantity() : 0;
            sku.setStockQuantity(stockQuantity - itemRequest.getQuantity());
            productSkuRepository.save(sku);

            int priceSnapshot = resolveOrderPrice(product, sku);
            if (priceSnapshot <= 0) {
                throw new IllegalArgumentException("order price is not configured. skuId=" + sku.getId());
            }
            int lineAmount = priceSnapshot * itemRequest.getQuantity();
            productAmount += lineAmount;

            HealthBoxOrderItemVo orderItem = new HealthBoxOrderItemVo();
            orderItem.setOrderId(order.getId());
            orderItem.setProductId(product.getId());
            orderItem.setSkuId(sku.getId());
            orderItem.setSkuCodeSnapshot(sku.getSkuCode());
            orderItem.setSkuNameSnapshot(sku.getSkuName());
            orderItem.setOptionSummarySnapshot(resolveOrderItemOptionSummary(itemRequest, sku.getId()));
            orderItem.setProductNameSnapshot(product.getName());
            orderItem.setPriceSnapshot(priceSnapshot);
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setCanceledQuantity(0);
            orderItem.setLineAmount(lineAmount);
            orderItem = orderItemRepository.save(orderItem);
            savedItems.add(orderItem);
        }

        CommerceAmounts commerceAmounts = resolveCommerceAmounts(productAmount, shippingZipCode, request.getDealerMallId());
        validateRequestedCommerceAmounts(request, commerceAmounts);
        order.setProductAmount(commerceAmounts.productAmount);
        order.setShippingFee(commerceAmounts.shippingFee);
        order.setDiscountAmount(commerceAmounts.discountAmount);
        order.setTotalPaymentAmount(commerceAmounts.totalPaymentAmount);
        order.setRemainingPaymentAmount(commerceAmounts.totalPaymentAmount);
        order.setCanceledPaymentAmount(0);
        order = orderRepository.save(order);
        saveOrderPayment(order, request.getPayment(), commerceAmounts.totalPaymentAmount);

        HealthBoxShipmentVo shipment = new HealthBoxShipmentVo();
        shipment.setOrderId(order.getId());
        shipment.setShipmentStatus("PENDING");
        shipment = shipmentRepository.save(shipment);

        for (HealthBoxOrderItemVo savedItem : savedItems) {
            HealthBoxShipmentItemVo shipmentItem = new HealthBoxShipmentItemVo();
            shipmentItem.setShipmentId(shipment.getId());
            shipmentItem.setOrderItemId(savedItem.getId());
            shipmentItem.setQuantity(savedItem.getQuantity());
            shipmentItemRepository.save(shipmentItem);
        }

        return buildOrderDetailResponse(order, shipment, savedItems);
    }

    public HealthBoxOrderQuoteResponse quoteOrder(HealthBoxOrderCreateRequest request) {
        validateOrderRequestForBuyer(request);
        validateBuyerAccess(
            request.getBuyerMemberId(),
            request.getDealerMallId(),
            request.getSessionToken()
        );

        int productAmount = calculateOrderItemsAmount(request.getItems());
        CommerceAmounts commerceAmounts = resolveCommerceAmounts(productAmount, request.getZipCode(), request.getDealerMallId());
        HealthBoxOrderQuoteResponse response = new HealthBoxOrderQuoteResponse();
        response.setProductAmount(commerceAmounts.productAmount);
        response.setShippingFee(commerceAmounts.shippingFee);
        response.setRemoteAreaFee(commerceAmounts.remoteAreaFee);
        response.setDiscountAmount(commerceAmounts.discountAmount);
        response.setTotalPaymentAmount(commerceAmounts.totalPaymentAmount);
        response.setFreeShippingThreshold(commerceAmounts.freeShippingThreshold);
        response.setRemainingForFreeShipping(
            Math.max(commerceAmounts.freeShippingThreshold - commerceAmounts.productAmount, 0)
        );
        return response;
    }

    public List<HealthBoxCartItemResponse> getBuyerCartItems(Long buyerMemberId, Long dealerMallId, String sessionToken) {
        validateBuyerAccess(buyerMemberId, dealerMallId, sessionToken);
        return buyerCartItemRepository.findByBuyerMemberIdAndDealerMallIdOrderByIdAsc(buyerMemberId, dealerMallId).stream()
            .map(this::buildCartItemResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public List<HealthBoxCartItemResponse> upsertBuyerCartItem(HealthBoxCartItemRequest request) {
        validateCartItemRequest(request);
        validateBuyerAccess(request.getBuyerMemberId(), request.getDealerMallId(), request.getSessionToken());

        if (request.getQuantity() <= 0) {
            buyerCartItemRepository.deleteByBuyerMemberIdAndDealerMallIdAndSkuId(
                request.getBuyerMemberId(),
                request.getDealerMallId(),
                request.getSkuId()
            );
            return getBuyerCartItems(request.getBuyerMemberId(), request.getDealerMallId(), request.getSessionToken());
        }

        HealthBoxProductSkuVo sku = productSkuRepository.findById(request.getSkuId())
            .orElseThrow(() -> new IllegalArgumentException("sku not found. id=" + request.getSkuId()));
        HealthBoxProductVo product = productRepository.findById(sku.getProductId())
            .orElseThrow(() -> new IllegalArgumentException("product not found for sku. productId=" + sku.getProductId()));
        validateOrderableSku(product, sku, request.getQuantity());

        HealthBoxBuyerCartItemVo cartItem = buyerCartItemRepository
            .findByBuyerMemberIdAndDealerMallIdAndSkuId(request.getBuyerMemberId(), request.getDealerMallId(), request.getSkuId())
            .orElseGet(HealthBoxBuyerCartItemVo::new);
        cartItem.setBuyerMemberId(request.getBuyerMemberId());
        cartItem.setDealerMallId(request.getDealerMallId());
        cartItem.setSkuId(request.getSkuId());
        cartItem.setQuantity(request.getQuantity());
        buyerCartItemRepository.save(cartItem);

        return getBuyerCartItems(request.getBuyerMemberId(), request.getDealerMallId(), request.getSessionToken());
    }

    @Transactional
    public List<HealthBoxCartItemResponse> deleteBuyerCartItem(Long buyerMemberId, Long dealerMallId, String sessionToken, Long skuId) {
        validateBuyerAccess(buyerMemberId, dealerMallId, sessionToken);
        buyerCartItemRepository.deleteByBuyerMemberIdAndDealerMallIdAndSkuId(buyerMemberId, dealerMallId, skuId);
        return getBuyerCartItems(buyerMemberId, dealerMallId, sessionToken);
    }

    @Transactional
    public void clearBuyerCart(Long buyerMemberId, Long dealerMallId, String sessionToken) {
        validateBuyerAccess(buyerMemberId, dealerMallId, sessionToken);
        buyerCartItemRepository.deleteByBuyerMemberIdAndDealerMallId(buyerMemberId, dealerMallId);
    }

    private void validateCartItemRequest(HealthBoxCartItemRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("cart item request is required");
        }
        if (request.getBuyerMemberId() == null) {
            throw new IllegalArgumentException("buyerMemberId is required");
        }
        if (request.getDealerMallId() == null) {
            throw new IllegalArgumentException("dealerMallId is required");
        }
        if (!StringUtils.hasText(request.getSessionToken())) {
            throw new IllegalArgumentException("sessionToken is required");
        }
        if (request.getSkuId() == null) {
            throw new IllegalArgumentException("skuId is required");
        }
        if (request.getQuantity() == null) {
            throw new IllegalArgumentException("quantity is required");
        }
    }

    private HealthBoxCartItemResponse buildCartItemResponse(HealthBoxBuyerCartItemVo cartItem) {
        HealthBoxProductSkuVo sku = productSkuRepository.findById(cartItem.getSkuId()).orElse(null);
        if (sku == null) {
            throw new IllegalArgumentException("sku not found. id=" + cartItem.getSkuId());
        }
        HealthBoxProductVo product = productRepository.findById(sku.getProductId())
            .orElseThrow(() -> new IllegalArgumentException("product not found for sku. productId=" + sku.getProductId()));

        int unitPrice = resolveOrderPrice(product, sku);
        int quantity = cartItem.getQuantity() != null ? cartItem.getQuantity() : 0;
        List<HealthBoxProductMediaResponse> mediaItems = productMediaRepository.findByProductIdOrderBySortOrderAscIdAsc(product.getId()).stream()
            .map(this::buildProductMediaResponse)
            .collect(Collectors.toList());

        HealthBoxCartItemResponse response = new HealthBoxCartItemResponse();
        response.setId(cartItem.getId());
        response.setBuyerMemberId(cartItem.getBuyerMemberId());
        response.setDealerMallId(cartItem.getDealerMallId());
        response.setSkuId(cartItem.getSkuId());
        response.setQuantity(quantity);
        response.setProductId(product.getId());
        response.setProductSlug(product.getSlug());
        response.setProductTitle(product.getName());
        response.setSkuCode(sku.getSkuCode());
        response.setSkuName(sku.getSkuName());
        response.setOptionSummary(buildOrderItemOptionSummary(sku.getId()));
        response.setUnitPrice(unitPrice);
        response.setLineAmount(unitPrice * quantity);
        response.setThumbnailUrl(resolveThumbnailUrl(mediaItems));
        return response;
    }

    private void validateOrderRequestForBuyer(HealthBoxOrderCreateRequest request) {
        if (request.getBuyerMemberId() == null) {
            throw new IllegalArgumentException("buyerMemberId is required");
        }
        if (request.getDealerMallId() == null) {
            throw new IllegalArgumentException("dealerMallId is required");
        }
        if (!StringUtils.hasText(request.getSessionToken())) {
            throw new IllegalArgumentException("sessionToken is required");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("order items are required");
        }
    }

    private int calculateOrderItemsAmount(List<HealthBoxOrderCreateItemRequest> itemRequests) {
        int totalPaymentAmount = 0;

        for (HealthBoxOrderCreateItemRequest itemRequest : itemRequests) {
            if (itemRequest == null || itemRequest.getSkuId() == null || itemRequest.getQuantity() == null || itemRequest.getQuantity() <= 0) {
                throw new IllegalArgumentException("valid skuId and quantity are required");
            }

            HealthBoxProductSkuVo sku = productSkuRepository.findById(itemRequest.getSkuId())
                .orElseThrow(() -> new IllegalArgumentException("sku not found. id=" + itemRequest.getSkuId()));
            HealthBoxProductVo product = productRepository.findById(sku.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("product not found for sku. productId=" + sku.getProductId()));

            validateOrderableSku(product, sku, itemRequest.getQuantity());
            int priceSnapshot = resolveOrderPrice(product, sku);
            if (priceSnapshot <= 0) {
                throw new IllegalArgumentException("order price is not configured. skuId=" + sku.getId());
            }
            totalPaymentAmount += priceSnapshot * itemRequest.getQuantity();
        }

        return totalPaymentAmount;
    }

    private CommerceAmounts resolveCommerceAmounts(int productAmount, String zipCode, Long dealerMallId) {
        int baseShippingFee = DEFAULT_BASE_SHIPPING_FEE;
        int freeShippingThreshold = DEFAULT_FREE_SHIPPING_THRESHOLD;
        int configuredRemoteAreaFee = DEFAULT_REMOTE_AREA_FEE;
        List<int[]> remoteAreaZipRanges = DEFAULT_REMOTE_AREA_ZIP_RANGES;
        String policyText = null;
        if (dealerMallId != null && dealerMallId > 0) {
            policyText = dealerMallPublicConfigRepository.findByDealerMallId(dealerMallId)
                .map(HealthBoxDealerMallPublicConfigVo::getPolicyText)
                .orElse(null);
        }
        if (!StringUtils.hasText(policyText)) {
            policyText = publicSiteConfigRepository.findById(SINGLETON_PUBLIC_SITE_CONFIG_ID)
                .map(HealthBoxPublicSiteConfigVo::getPolicyText)
                .orElse(null);
        }

        if (StringUtils.hasText(policyText)) {
            try {
                JsonElement parsed = new JsonParser().parse(policyText);
                if (parsed.isJsonObject()) {
                    JsonObject root = parsed.getAsJsonObject();
                    JsonElement schema = root.get("schema");
                    JsonElement commerceElement = root.get("commerce");
                    if (schema != null
                        && schema.isJsonPrimitive()
                        && "health-box-storefront-policy".equals(schema.getAsString())
                        && commerceElement != null
                        && commerceElement.isJsonObject()) {
                        JsonObject commerce = commerceElement.getAsJsonObject();
                        baseShippingFee = nonNegativeJsonInteger(
                            commerce.get("baseShippingFee"),
                            DEFAULT_BASE_SHIPPING_FEE
                        );
                        freeShippingThreshold = nonNegativeJsonInteger(
                            commerce.get("freeShippingThreshold"),
                            DEFAULT_FREE_SHIPPING_THRESHOLD
                        );
                        configuredRemoteAreaFee = nonNegativeJsonInteger(
                            commerce.get("remoteAreaFee"),
                            DEFAULT_REMOTE_AREA_FEE
                        );
                        remoteAreaZipRanges = resolveRemoteAreaZipRanges(commerce.get("remoteAreaZipRanges"));
                    }
                }
            } catch (RuntimeException ignored) {
                baseShippingFee = DEFAULT_BASE_SHIPPING_FEE;
                freeShippingThreshold = DEFAULT_FREE_SHIPPING_THRESHOLD;
                configuredRemoteAreaFee = DEFAULT_REMOTE_AREA_FEE;
                remoteAreaZipRanges = DEFAULT_REMOTE_AREA_ZIP_RANGES;
            }
        }

        int safeProductAmount = Math.max(productAmount, 0);
        int baseFee = baseShippingFee <= 0
            || (freeShippingThreshold > 0 && safeProductAmount >= freeShippingThreshold)
            ? 0
            : baseShippingFee;
        int remoteAreaFee = isRemoteAreaZipCode(zipCode, remoteAreaZipRanges) ? configuredRemoteAreaFee : 0;
        int shippingFee = baseFee + remoteAreaFee;
        int discountAmount = 0;
        return new CommerceAmounts(
            safeProductAmount,
            shippingFee,
            remoteAreaFee,
            discountAmount,
            safeProductAmount + shippingFee - discountAmount,
            freeShippingThreshold
        );
    }

    private List<int[]> resolveRemoteAreaZipRanges(JsonElement element) {
        if (element == null || !element.isJsonArray()) {
            return DEFAULT_REMOTE_AREA_ZIP_RANGES;
        }

        JsonArray rawRanges = element.getAsJsonArray();
        List<int[]> ranges = new ArrayList<>();
        for (JsonElement rawRange : rawRanges) {
            if (rawRange == null || !rawRange.isJsonPrimitive()) {
                continue;
            }

            int[] range = parseRemoteAreaZipRange(rawRange.getAsString());
            if (range != null) {
                ranges.add(range);
            }
        }

        return ranges;
    }

    private int[] parseRemoteAreaZipRange(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String[] parts = value.trim().split("[-~]", 2);
        Integer start = parseZipCode(parts[0]);
        if (start == null) {
            return null;
        }

        Integer end = parts.length > 1 ? parseZipCode(parts[1]) : null;
        if (end == null) {
            end = start;
        }

        return start <= end ? new int[] { start, end } : new int[] { end, start };
    }

    private Integer parseZipCode(String value) {
        if (value == null) {
            return null;
        }

        String digits = value.replaceAll("[^0-9]", "");
        if (digits.length() != 5) {
            return null;
        }

        try {
            return Integer.parseInt(digits);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private boolean isRemoteAreaZipCode(String zipCode, List<int[]> ranges) {
        Integer numericZipCode = parseZipCode(zipCode);
        if (numericZipCode == null || ranges == null || ranges.isEmpty()) {
            return false;
        }

        for (int[] range : ranges) {
            if (numericZipCode >= range[0] && numericZipCode <= range[1]) {
                return true;
            }
        }

        return false;
    }

    private int nonNegativeJsonInteger(JsonElement element, int fallback) {
        if (element == null || !element.isJsonPrimitive() || !element.getAsJsonPrimitive().isNumber()) {
            return fallback;
        }

        try {
            int value = element.getAsInt();
            return value >= 0 ? value : fallback;
        } catch (RuntimeException ignored) {
            return fallback;
        }
    }

    private void validateRequestedCommerceAmounts(
        HealthBoxOrderCreateRequest request,
        CommerceAmounts commerceAmounts
    ) {
        validateRequestedAmount("productAmount", request.getProductAmount(), commerceAmounts.productAmount);
        validateRequestedAmount("shippingFee", request.getShippingFee(), commerceAmounts.shippingFee);
        validateRequestedAmount("discountAmount", request.getDiscountAmount(), commerceAmounts.discountAmount);
        validateRequestedAmount("totalPaymentAmount", request.getTotalPaymentAmount(), commerceAmounts.totalPaymentAmount);
    }

    private void validateRequestedAmount(String fieldName, Integer requestedAmount, int calculatedAmount) {
        if (requestedAmount != null && requestedAmount != calculatedAmount) {
            throw new IllegalArgumentException(fieldName + " mismatch. calculatedAmount=" + calculatedAmount);
        }
    }

    private static final class CommerceAmounts {
        private final int productAmount;
        private final int shippingFee;
        private final int remoteAreaFee;
        private final int discountAmount;
        private final int totalPaymentAmount;
        private final int freeShippingThreshold;

        private CommerceAmounts(
            int productAmount,
            int shippingFee,
            int remoteAreaFee,
            int discountAmount,
            int totalPaymentAmount,
            int freeShippingThreshold
        ) {
            this.productAmount = productAmount;
            this.shippingFee = shippingFee;
            this.remoteAreaFee = remoteAreaFee;
            this.discountAmount = discountAmount;
            this.totalPaymentAmount = totalPaymentAmount;
            this.freeShippingThreshold = freeShippingThreshold;
        }
    }

    @Transactional
    public HealthBoxOrderDetailResponse cancelOrder(Long orderId) {
        HealthBoxOrderVo order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("order not found. id=" + orderId));

        if ("CANCELED".equalsIgnoreCase(order.getOrderStatus())) {
            List<HealthBoxOrderItemVo> existingItems = orderItemRepository.findByOrderIdOrderByIdAsc(orderId);
            HealthBoxShipmentVo existingShipment = shipmentRepository.findByOrderId(orderId).orElse(null);
            return buildOrderDetailResponse(order, existingShipment, existingItems);
        }

        cancelConfirmedTossPayment(
            order,
            null,
            "healthbox-full-cancel-" + orderId,
            "판매자 주문 전체 취소"
        );

        List<HealthBoxOrderItemVo> items = orderItemRepository.findByOrderIdOrderByIdAsc(orderId);
        for (HealthBoxOrderItemVo item : items) {
            int remainingQuantity = getRemainingOrderItemQuantity(item);
            if (remainingQuantity <= 0) {
                continue;
            }
            restoreSkuStock(item.getSkuId(), remainingQuantity);
            item.setCanceledQuantity(item.getQuantity());
            orderItemRepository.save(item);
        }

        recalculateOrderAfterCancellation(order);
        HealthBoxShipmentVo shipment = updateShipmentAfterCancellation(orderId, order.getOrderStatus());
        return buildOrderDetailResponse(order, shipment, items);
    }

    @Transactional
    public HealthBoxOrderDetailResponse partialCancelOrder(Long orderId, HealthBoxOrderPartialCancelRequest request) {
        HealthBoxOrderVo order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("order not found. id=" + orderId));

        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("partial cancel items are required");
        }
        if (
            !StringUtils.hasText(request.getRequestId()) ||
            !request.getRequestId().trim().matches("[A-Za-z0-9_-]{6,100}")
        ) {
            throw new IllegalArgumentException("partial cancel requestId is required");
        }

        String cancellationRequestId = request.getRequestId().trim();
        HealthBoxPaymentCancelRequestVo existingCancellation = paymentCancelRequestRepository
            .findByRequestId(cancellationRequestId)
            .orElse(null);
        if (existingCancellation != null) {
            if (!orderId.equals(existingCancellation.getOrderId())) {
                throw new IllegalArgumentException("partial cancel requestId already belongs to another order");
            }
            return buildOrderDetailResponse(order);
        }

        int canceledAmountBefore = order.getCanceledPaymentAmount() != null ? order.getCanceledPaymentAmount() : 0;

        Map<Long, HealthBoxOrderItemVo> orderItemMap = orderItemRepository.findByOrderIdOrderByIdAsc(orderId).stream()
            .collect(Collectors.toMap(HealthBoxOrderItemVo::getId, item -> item));

        Map<Long, Integer> requestedCancelQuantities = new HashMap<>();
        int partialCancelAmount = 0;

        for (HealthBoxOrderCancelItemRequest cancelItem : request.getItems()) {
            if (cancelItem == null || cancelItem.getOrderItemId() == null || cancelItem.getQuantity() == null || cancelItem.getQuantity() <= 0) {
                throw new IllegalArgumentException("valid orderItemId and quantity are required");
            }

            HealthBoxOrderItemVo orderItem = orderItemMap.get(cancelItem.getOrderItemId());
            if (orderItem == null) {
                throw new IllegalArgumentException("order item not found in order. orderItemId=" + cancelItem.getOrderItemId());
            }

            int remainingQuantity = getRemainingOrderItemQuantity(orderItem);
            if (cancelItem.getQuantity() > remainingQuantity) {
                throw new IllegalArgumentException("cancel quantity exceeds remaining quantity. orderItemId=" + orderItem.getId());
            }

            if (requestedCancelQuantities.put(orderItem.getId(), cancelItem.getQuantity()) != null) {
                throw new IllegalArgumentException("duplicate orderItemId in partial cancel request. orderItemId=" + orderItem.getId());
            }
            partialCancelAmount += cancelItem.getQuantity() * (orderItem.getPriceSnapshot() != null ? orderItem.getPriceSnapshot() : 0);
        }

        boolean cancelsAllRemainingItems = orderItemMap.values().stream().allMatch(
            item -> requestedCancelQuantities.getOrDefault(item.getId(), 0) == getRemainingOrderItemQuantity(item)
        );
        if (!cancelsAllRemainingItems && partialCancelAmount <= 0) {
            throw new IllegalArgumentException("partial cancel amount must be positive");
        }

        cancelConfirmedTossPayment(
            order,
            cancelsAllRemainingItems ? null : partialCancelAmount,
            cancellationRequestId,
            "판매자 주문상품 부분 취소"
        );

        for (HealthBoxOrderCancelItemRequest cancelItem : request.getItems()) {
            HealthBoxOrderItemVo orderItem = orderItemMap.get(cancelItem.getOrderItemId());
            restoreSkuStock(orderItem.getSkuId(), cancelItem.getQuantity());
            orderItem.setCanceledQuantity((orderItem.getCanceledQuantity() != null ? orderItem.getCanceledQuantity() : 0) + cancelItem.getQuantity());
            orderItemRepository.save(orderItem);
        }

        recalculateOrderAfterCancellation(order);
        int canceledAmountAfter = order.getCanceledPaymentAmount() != null ? order.getCanceledPaymentAmount() : 0;
        HealthBoxPaymentCancelRequestVo cancellationRequest = new HealthBoxPaymentCancelRequestVo();
        cancellationRequest.setRequestId(cancellationRequestId);
        cancellationRequest.setOrderId(orderId);
        cancellationRequest.setCancelAmount(Math.max(canceledAmountAfter - canceledAmountBefore, 0));
        cancellationRequest.setStatus("APPLIED");
        paymentCancelRequestRepository.save(cancellationRequest);
        HealthBoxShipmentVo shipment = updateShipmentAfterCancellation(orderId, order.getOrderStatus());
        List<HealthBoxOrderItemVo> items = orderItemRepository.findByOrderIdOrderByIdAsc(orderId);
        return buildOrderDetailResponse(order, shipment, items);
    }

    public List<HealthBoxOrderDetailResponse> getBuyerOrders(Long buyerMemberId, Long dealerMallId, String sessionToken) {
        validateBuyerAccess(buyerMemberId, dealerMallId, sessionToken);
        return orderRepository.findByBuyerMemberIdAndDealerMallIdOrderByIdDesc(buyerMemberId, dealerMallId).stream()
            .map(this::buildOrderDetailResponse)
            .collect(Collectors.toList());
    }

    public HealthBoxOrderDetailResponse getBuyerOrderDetail(Long orderId, Long buyerMemberId, Long dealerMallId, String sessionToken) {
        validateBuyerAccess(buyerMemberId, dealerMallId, sessionToken);
        HealthBoxOrderVo order = orderRepository.findByIdAndBuyerMemberIdAndDealerMallId(orderId, buyerMemberId, dealerMallId)
            .orElseThrow(() -> new IllegalArgumentException("order not found. id=" + orderId));
        return buildOrderDetailResponse(order);
    }

    public HealthBoxOrderDetailResponse getOrderDetail(Long orderId) {
        HealthBoxOrderVo order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("order not found. id=" + orderId));
        return buildOrderDetailResponse(order);
    }

    public HealthBoxOrderDetailResponse getOrderDetailByShipmentId(Long shipmentId) {
        HealthBoxShipmentVo shipment = shipmentRepository.findById(shipmentId)
            .orElseThrow(() -> new IllegalArgumentException("shipment not found. id=" + shipmentId));
        return getOrderDetail(shipment.getOrderId());
    }

    public List<HealthBoxDealerMallVo> getDealerMalls() {
        return dealerMallRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    public HealthBoxDealerMallVo getDealerMall(Long dealerMallId) {
        return dealerMallRepository.findById(dealerMallId)
            .orElseThrow(() -> new IllegalArgumentException("dealer mall not found. id=" + dealerMallId));
    }

    public List<HealthBoxDealerApplicationVo> getDealerApplications() {
        return dealerApplicationRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    public List<HealthBoxBuyerSignupApplicationVo> getBuyerSignupApplications() {
        return buyerSignupApplicationRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    public List<HealthBoxBuyerSignupApplicationVo> getBuyerSignupApplicationsByDealerMall(Long dealerMallId) {
        return buyerSignupApplicationRepository.findByDealerMallIdOrderByIdDesc(dealerMallId);
    }

    public List<HealthBoxCategoryResponse> getCategories() {
        return categoryRepository.findByDeletedYnNotOrDeletedYnIsNull("Y", Sort.by(Sort.Direction.ASC, "sortOrder", "id")).stream()
            .map(this::buildCategoryResponse)
            .collect(Collectors.toList());
    }

    public HealthBoxCategoryResponse getCategory(Long categoryId) {
        HealthBoxCategoryVo category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new IllegalArgumentException("category not found. id=" + categoryId));
        return buildCategoryResponse(category);
    }

    @Transactional
    public HealthBoxCategoryResponse saveCategory(HealthBoxCategorySaveRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("category request is required");
        }
        if (!StringUtils.hasText(request.getName())) {
            throw new IllegalArgumentException("category name is required");
        }
        if (!StringUtils.hasText(request.getSlug())) {
            throw new IllegalArgumentException("category slug is required");
        }

        HealthBoxCategoryVo target = request.getId() != null
            ? categoryRepository.findById(request.getId()).orElse(new HealthBoxCategoryVo())
            : new HealthBoxCategoryVo();

        String normalizedSlug = normalizeSlug(request.getSlug());
        HealthBoxCategoryVo existingBySlug = categoryRepository.findBySlug(normalizedSlug).orElse(null);
        if (existingBySlug != null && !existingBySlug.getId().equals(target.getId())) {
            throw new IllegalArgumentException("category slug already exists. slug=" + normalizedSlug);
        }

        String requestedCategoryCode = normalizeCategoryCode(request.getCategoryCode());
        if (StringUtils.hasText(requestedCategoryCode)) {
            HealthBoxCategoryVo existingByCode = categoryRepository.findByCategoryCode(requestedCategoryCode).orElse(null);
            if (existingByCode != null && !existingByCode.getId().equals(target.getId())) {
                throw new IllegalArgumentException("category code already exists. categoryCode=" + requestedCategoryCode);
            }
        }

        target.setName(request.getName().trim());
        target.setSlug(normalizedSlug);
        target.setCategoryCode(requestedCategoryCode);
        target.setSortOrder(request.getSortOrder());
        target.setStatus(StringUtils.hasText(request.getStatus()) ? request.getStatus().trim() : "ACTIVE");
        if (!StringUtils.hasText(target.getDeletedYn())) {
            target.setDeletedYn("N");
        }
        if ("N".equalsIgnoreCase(target.getDeletedYn())) {
            target.setDeletedAt(null);
        }

        HealthBoxCategoryVo saved = categoryRepository.save(target);
        if (!StringUtils.hasText(saved.getCategoryCode())) {
            saved.setCategoryCode(generateCategoryCode(saved.getId()));
            saved = categoryRepository.save(saved);
        }
        return buildCategoryResponse(saved);
    }

    @Transactional
    public HealthBoxCategoryResponse deleteCategory(Long categoryId) {
        HealthBoxCategoryVo category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new IllegalArgumentException("category not found. id=" + categoryId));

        category.setDeletedYn("Y");
        category.setDeletedAt(LocalDateTime.now());
        category.setStatus("INACTIVE");
        return buildCategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public HealthBoxProductDetailResponse saveProduct(HealthBoxProductSaveRequest request) {
        HealthBoxProductVo target = request.getId() != null
            ? productRepository.findById(request.getId()).orElse(new HealthBoxProductVo())
            : new HealthBoxProductVo();

        if (!StringUtils.hasText(request.getName())) {
            throw new IllegalArgumentException("product name is required");
        }
        if (request.getCategoryId() == null) {
            throw new IllegalArgumentException("categoryId is required");
        }
        HealthBoxCategoryVo category = resolveActiveCategory(request.getCategoryId());
        String resolvedSlug = resolveProductSlug(target, request.getSlug(), request.getName());

        target.setName(request.getName().trim());
        target.setProductCode(StringUtils.hasText(target.getProductCode()) ? target.getProductCode() : null);
        target.setSlug(resolvedSlug);
        target.setBrandName(request.getBrandName());
        target.setCategoryId(category.getId());
        target.setStatus(StringUtils.hasText(request.getStatus()) ? request.getStatus().trim() : "ACTIVE");
        target.setPublishStatus(request.getPublishStatus());
        target.setOptionUseYn(resolveOptionUseYn(request));
        target.setSummaryText(request.getSummaryText());
        applySalesPolicy(target, request.getSalesPolicyId(), request.getSalesPolicyText());
        applyDeliveryPolicy(target, request.getDeliveryPolicyId(), request.getDeliveryPolicyText());
        target.setDetailHtml(request.getDetailHtml());
        target.setSortOrder(request.getSortOrder());
        target.setConsumerPrice(request.getConsumerPrice());
        target.setMemberPrice(request.getMemberPrice());
        target.setSupplyPrice(request.getSupplyPrice());
        target.setSettlementBasePrice(request.getSettlementBasePrice());
        target.setPriceExposurePolicy(request.getPriceExposurePolicy());
        if (!StringUtils.hasText(target.getDeletedYn())) {
            target.setDeletedYn("N");
        }
        if ("N".equalsIgnoreCase(target.getDeletedYn())) {
            target.setDeletedAt(null);
        }

        HealthBoxProductVo saved = productRepository.save(target);
        if (!StringUtils.hasText(saved.getProductCode())) {
            saved.setProductCode(generateProductCode(saved.getId()));
            saved = productRepository.save(saved);
        }
        syncProductMedia(saved.getId(), request.getMediaItems());
        syncProductOptionsAndSkus(saved, request);
        return buildProductDetailResponse(saved);
    }

    public Page<HealthBoxProductSummaryResponse> getProducts(String q, String category, String status, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        Specification<HealthBoxProductVo> specification = Specification.where(
            (root, query, cb) -> cb.or(
                cb.isNull(root.get("deletedYn")),
                cb.notEqual(cb.upper(root.get("deletedYn")), "Y")
            )
        );

        if (StringUtils.hasText(q)) {
            String keyword = "%" + q.trim().toLowerCase() + "%";
            specification = specification.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("productCode")), keyword),
                cb.like(cb.lower(root.get("name")), keyword),
                cb.like(cb.lower(root.get("slug")), keyword),
                cb.like(cb.lower(root.get("brandName")), keyword)
            ));
        }

        if (StringUtils.hasText(category)) {
            HealthBoxCategoryVo categoryVo = categoryRepository.findByNameIgnoreCaseOrSlugIgnoreCase(category.trim(), category.trim())
                .orElse(null);
            if (categoryVo == null) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }
            specification = specification.and((root, query, cb) -> cb.equal(root.get("categoryId"), categoryVo.getId()));
        }

        if (StringUtils.hasText(status)) {
            String normalizedStatus = status.trim().toLowerCase();
            if (!"all".equals(normalizedStatus) && !"전체".equals(normalizedStatus)) {
                specification = specification.and((root, query, cb) -> cb.equal(cb.lower(root.get("publishStatus")), normalizedStatus));
            }
        }

        return productRepository.findAll(specification, pageable).map(this::buildProductSummaryResponse);
    }

    public Page<HealthBoxDealerProductSummaryResponse> getDealerMallProducts(String dealerSlug, String q, String category, int page, int size) {
        getActiveDealerPublicViewBySlug(dealerSlug);

        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        Specification<HealthBoxProductVo> specification = Specification.where(
            (root, query, cb) -> cb.and(
                cb.or(
                    cb.isNull(root.get("deletedYn")),
                    cb.notEqual(cb.upper(root.get("deletedYn")), "Y")
                ),
                cb.equal(cb.upper(root.get("status")), "ACTIVE"),
                cb.notEqual(cb.lower(cb.coalesce(root.get("publishStatus"), "")), "삭제됨"),
                cb.notEqual(cb.lower(cb.coalesce(root.get("publishStatus"), "")), "비노출"),
                cb.notEqual(cb.lower(cb.coalesce(root.get("publishStatus"), "")), "미노출"),
                cb.notEqual(cb.lower(cb.coalesce(root.get("publishStatus"), "")), "판매중지")
            )
        );

        if (StringUtils.hasText(q)) {
            String keyword = "%" + q.trim().toLowerCase() + "%";
            specification = specification.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), keyword),
                cb.like(cb.lower(root.get("slug")), keyword),
                cb.like(cb.lower(root.get("brandName")), keyword)
            ));
        }

        if (StringUtils.hasText(category)) {
            HealthBoxCategoryVo categoryVo = categoryRepository.findByNameIgnoreCaseOrSlugIgnoreCase(category.trim(), category.trim())
                .orElse(null);
            if (categoryVo == null || "Y".equalsIgnoreCase(categoryVo.getDeletedYn()) || !"ACTIVE".equalsIgnoreCase(categoryVo.getStatus())) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }
            specification = specification.and((root, query, cb) -> cb.equal(root.get("categoryId"), categoryVo.getId()));
        }

        return productRepository.findAll(specification, pageable).map(this::buildDealerProductSummaryResponse);
    }

    public HealthBoxProductDetailResponse getProduct(Long productId) {
        HealthBoxProductVo product = productRepository.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("product not found. id=" + productId));
        return buildProductDetailResponse(product);
    }

    public HealthBoxDealerProductDetailResponse getDealerMallProductDetail(String dealerSlug, String productSlug) {
        getActiveDealerPublicViewBySlug(dealerSlug);

        HealthBoxProductVo product = productRepository.findBySlug(productSlug)
            .orElseThrow(() -> new IllegalArgumentException("product not found. slug=" + productSlug));
        validateDealerVisibleProduct(product);
        return buildDealerProductDetailResponse(product);
    }

    public List<HealthBoxProductSkuResponse> getProductSkus(Long productId) {
        productRepository.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("product not found. id=" + productId));
        return buildProductSkuResponses(productId);
    }

    @Transactional
    public HealthBoxProductDetailResponse deleteProduct(Long productId) {
        HealthBoxProductVo product = productRepository.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("product not found. id=" + productId));

        product.setDeletedYn("Y");
        product.setDeletedAt(LocalDateTime.now());
        product.setStatus("INACTIVE");
        if (!StringUtils.hasText(product.getPublishStatus()) || !"삭제됨".equals(product.getPublishStatus())) {
            product.setPublishStatus("삭제됨");
        }

        HealthBoxProductVo saved = productRepository.save(product);
        return buildProductDetailResponse(saved);
    }

    @Transactional
    public HealthBoxProductSkuResponse updateProductSkuStock(Long skuId, HealthBoxProductSkuStockUpdateRequest request) {
        HealthBoxProductSkuVo sku = productSkuRepository.findWithLockById(skuId)
            .orElseThrow(() -> new IllegalArgumentException("sku not found. id=" + skuId));

        if (request.getStockQuantity() != null) {
            if (request.getStockQuantity() < 0) {
                throw new IllegalArgumentException("stockQuantity cannot be negative");
            }
            sku.setStockQuantity(request.getStockQuantity());
        }
        if (request.getSafetyStock() != null) {
            if (request.getSafetyStock() < 0) {
                throw new IllegalArgumentException("safetyStock cannot be negative");
            }
            sku.setSafetyStock(request.getSafetyStock());
        }
        if (StringUtils.hasText(request.getSoldOutYn())) {
            sku.setSoldOutYn(request.getSoldOutYn().trim());
        }
        if (StringUtils.hasText(request.getStatus())) {
            sku.setStatus(request.getStatus().trim());
        }

        HealthBoxProductSkuVo saved = productSkuRepository.save(sku);
        return buildProductSkuResponse(saved, findOptionValueCodesBySkuId(saved.getId()));
    }

    public List<HealthBoxSalesPolicyVo> getSalesPolicies() {
        return salesPolicyRepository.findByDeletedYnNotOrDeletedYnIsNull("Y", Sort.by(Sort.Direction.ASC, "sortOrder", "id"));
    }

    public HealthBoxSalesPolicyVo getSalesPolicy(Long policyId) {
        return salesPolicyRepository.findById(policyId)
            .orElseThrow(() -> new IllegalArgumentException("sales policy not found. id=" + policyId));
    }

    @Transactional
    public HealthBoxSalesPolicyVo saveSalesPolicy(HealthBoxSalesPolicyVo vo) {
        HealthBoxSalesPolicyVo target = vo.getId() != null
            ? salesPolicyRepository.findById(vo.getId()).orElse(new HealthBoxSalesPolicyVo())
            : new HealthBoxSalesPolicyVo();

        if (!StringUtils.hasText(vo.getTitle())) {
            throw new IllegalArgumentException("sales policy title is required");
        }
        if (!StringUtils.hasText(vo.getContent())) {
            throw new IllegalArgumentException("sales policy content is required");
        }

        target.setTitle(vo.getTitle().trim());
        target.setContent(vo.getContent());
        target.setStatus(StringUtils.hasText(vo.getStatus()) ? vo.getStatus().trim() : "ACTIVE");
        target.setSortOrder(vo.getSortOrder());
        if (!StringUtils.hasText(target.getDeletedYn())) {
            target.setDeletedYn("N");
        }
        if ("N".equalsIgnoreCase(target.getDeletedYn())) {
            target.setDeletedAt(null);
        }

        return salesPolicyRepository.save(target);
    }

    @Transactional
    public HealthBoxSalesPolicyVo deleteSalesPolicy(Long policyId) {
        HealthBoxSalesPolicyVo target = salesPolicyRepository.findById(policyId)
            .orElseThrow(() -> new IllegalArgumentException("sales policy not found. id=" + policyId));
        target.setDeletedYn("Y");
        target.setDeletedAt(LocalDateTime.now());
        target.setStatus("INACTIVE");
        return salesPolicyRepository.save(target);
    }

    public List<HealthBoxDeliveryPolicyVo> getDeliveryPolicies() {
        return deliveryPolicyRepository.findByDeletedYnNotOrDeletedYnIsNull("Y", Sort.by(Sort.Direction.ASC, "sortOrder", "id"));
    }

    public HealthBoxDeliveryPolicyVo getDeliveryPolicy(Long policyId) {
        return deliveryPolicyRepository.findById(policyId)
            .orElseThrow(() -> new IllegalArgumentException("delivery policy not found. id=" + policyId));
    }

    @Transactional
    public HealthBoxDeliveryPolicyVo saveDeliveryPolicy(HealthBoxDeliveryPolicyVo vo) {
        HealthBoxDeliveryPolicyVo target = vo.getId() != null
            ? deliveryPolicyRepository.findById(vo.getId()).orElse(new HealthBoxDeliveryPolicyVo())
            : new HealthBoxDeliveryPolicyVo();

        if (!StringUtils.hasText(vo.getTitle())) {
            throw new IllegalArgumentException("delivery policy title is required");
        }
        if (!StringUtils.hasText(vo.getContent())) {
            throw new IllegalArgumentException("delivery policy content is required");
        }

        target.setTitle(vo.getTitle().trim());
        target.setContent(vo.getContent());
        target.setStatus(StringUtils.hasText(vo.getStatus()) ? vo.getStatus().trim() : "ACTIVE");
        target.setSortOrder(vo.getSortOrder());
        if (!StringUtils.hasText(target.getDeletedYn())) {
            target.setDeletedYn("N");
        }
        if ("N".equalsIgnoreCase(target.getDeletedYn())) {
            target.setDeletedAt(null);
        }

        return deliveryPolicyRepository.save(target);
    }

    @Transactional
    public HealthBoxDeliveryPolicyVo deleteDeliveryPolicy(Long policyId) {
        HealthBoxDeliveryPolicyVo target = deliveryPolicyRepository.findById(policyId)
            .orElseThrow(() -> new IllegalArgumentException("delivery policy not found. id=" + policyId));
        target.setDeletedYn("Y");
        target.setDeletedAt(LocalDateTime.now());
        target.setStatus("INACTIVE");
        return deliveryPolicyRepository.save(target);
    }

    @Transactional
    public HealthBoxNoticeVo saveNotice(HealthBoxNoticeSaveRequest request) {
        return saveNotice(request, null);
    }

    @Transactional
    public HealthBoxNoticeVo saveNotice(HealthBoxNoticeSaveRequest request, Long dealerMallId) {
        HealthBoxNoticeVo target = request.getId() != null
            ? noticeRepository.findById(request.getId()).orElse(new HealthBoxNoticeVo())
            : new HealthBoxNoticeVo();

        if (target.getId() != null && !Objects.equals(target.getDealerMallId(), dealerMallId)) {
            throw new IllegalArgumentException("notice scope mismatch");
        }

        if (!StringUtils.hasText(request.getTitle())) {
            throw new IllegalArgumentException("title is required");
        }

        if (!StringUtils.hasText(request.getBody())) {
            throw new IllegalArgumentException("content is required");
        }

        target.setTitle(request.getTitle().trim());
        target.setSlug(resolveNoticeSlug(target, request));
        target.setNoticeType(StringUtils.hasText(request.getCategory()) ? request.getCategory().trim() : "운영안내");
        target.setContent(request.getBody());
        target.setAuthorAccountId(request.getAuthorAccountId());
        target.setDealerMallId(dealerMallId);

        applyNoticeStatus(target, request);
        return noticeRepository.save(target);
    }

    public List<HealthBoxNoticeVo> getNotices() {
        return noticeRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    public List<HealthBoxNoticeVo> getNotices(Long dealerMallId) {
        return dealerMallId == null
            ? noticeRepository.findByDealerMallIdIsNullOrderByIdDesc()
            : noticeRepository.findByDealerMallIdOrderByIdDesc(dealerMallId);
    }

    public List<HealthBoxNoticeVo> getPostedNotices(Long dealerMallId) {
        return dealerMallId == null
            ? noticeRepository.findByDealerMallIdIsNullAndPostStatusIgnoreCaseOrderByPinnedYnDescPostedAtDescIdDesc("POSTED")
            : noticeRepository.findByDealerMallIdAndPostStatusIgnoreCaseOrderByPinnedYnDescPostedAtDescIdDesc(dealerMallId, "POSTED");
    }

    public HealthBoxNoticeVo getNotice(Long noticeId) {
        return noticeRepository.findById(noticeId)
            .orElseThrow(() -> new IllegalArgumentException("notice not found. id=" + noticeId));
    }

    public HealthBoxNoticeVo getNotice(Long noticeId, Long dealerMallId, boolean postedOnly) {
        HealthBoxNoticeVo notice = getNotice(noticeId);
        if (!Objects.equals(notice.getDealerMallId(), dealerMallId)
            || (postedOnly && !"POSTED".equalsIgnoreCase(notice.getPostStatus()))) {
            throw new IllegalArgumentException("notice not found. id=" + noticeId);
        }
        return notice;
    }

    @Transactional
    public void deleteNotice(Long noticeId) {
        HealthBoxNoticeVo notice = noticeRepository.findById(noticeId)
            .orElseThrow(() -> new IllegalArgumentException("notice not found. id=" + noticeId));
        noticeRepository.delete(notice);
    }

    @Transactional
    public void deleteNotice(Long noticeId, Long dealerMallId) {
        noticeRepository.delete(getNotice(noticeId, dealerMallId, false));
    }

    @Transactional
    public HealthBoxShipmentVo updateShipmentStatus(Long shipmentId, HealthBoxShipmentStatusRequest request) {
        HealthBoxShipmentVo shipment = shipmentRepository.findById(shipmentId)
            .orElseThrow(() -> new IllegalArgumentException("shipment not found. id=" + shipmentId));

        shipment.setShipmentStatus(request.getShipmentStatus());
        shipment.setCourierCompany(request.getCourierCompany());
        shipment.setTrackingNo(request.getTrackingNo());
        shipment.setShippedAt(request.getShippedAt());
        shipment.setDeliveredAt(request.getDeliveredAt());
        shipment.setHandlerAccountId(request.getHandlerAccountId());
        return shipmentRepository.save(shipment);
    }

    public List<HealthBoxMonthlySalesSummaryVo> getMonthlySalesSummaries(Long dealerMallId) {
        return monthlySalesSummaryRepository.findByDealerMallIdOrderByBaseYearMonthDesc(dealerMallId);
    }

    public List<HealthBoxMonthlySettlementSummaryVo> getMonthlySettlementSummaries(Long dealerMallId) {
        return monthlySettlementSummaryRepository.findByDealerMallIdOrderByBaseYearMonthDesc(dealerMallId);
    }

    public HealthBoxPublicSiteConfigVo getPublicSiteConfig() {
        return publicSiteConfigRepository.findById(SINGLETON_PUBLIC_SITE_CONFIG_ID)
            .orElseGet(() -> {
                HealthBoxPublicSiteConfigVo vo = new HealthBoxPublicSiteConfigVo();
                vo.setId(SINGLETON_PUBLIC_SITE_CONFIG_ID);
                return vo;
            });
    }

    @Transactional
    public HealthBoxPublicSiteConfigVo savePublicSiteConfig(HealthBoxPublicSiteConfigVo vo) {
        HealthBoxPublicSiteConfigVo target = publicSiteConfigRepository.findById(SINGLETON_PUBLIC_SITE_CONFIG_ID)
            .orElseGet(() -> {
                HealthBoxPublicSiteConfigVo newVo = new HealthBoxPublicSiteConfigVo();
                newVo.setId(SINGLETON_PUBLIC_SITE_CONFIG_ID);
                return newVo;
            });

        target.setLogoUrl(coalesce(vo.getLogoUrl(), target.getLogoUrl()));
        target.setFaviconUrl(coalesce(vo.getFaviconUrl(), target.getFaviconUrl()));
        if (vo.getMainVisualUrl() != null) {
            target.setMainVisualUrl(StringUtils.hasText(vo.getMainVisualUrl()) ? vo.getMainVisualUrl().trim() : null);
        }
        if (vo.getMainVisualLinkUrl() != null) {
            target.setMainVisualLinkUrl(normalizeStorefrontLink(vo.getMainVisualLinkUrl()));
        }
        if (vo.getMiddleBannerUrl() != null) {
            target.setMiddleBannerUrl(StringUtils.hasText(vo.getMiddleBannerUrl()) ? vo.getMiddleBannerUrl().trim() : null);
        }
        if (vo.getMiddleBannerLinkUrl() != null) {
            target.setMiddleBannerLinkUrl(normalizeStorefrontLink(vo.getMiddleBannerLinkUrl()));
        }
        target.setShareThumbnailUrl(coalesce(vo.getShareThumbnailUrl(), target.getShareThumbnailUrl()));
        target.setMetaTitle(coalesce(vo.getMetaTitle(), target.getMetaTitle()));
        target.setMetaDescription(coalesce(vo.getMetaDescription(), target.getMetaDescription()));
        target.setMainNavigationJson(coalesce(vo.getMainNavigationJson(), target.getMainNavigationJson()));
        target.setSearchPlaceholder(coalesce(vo.getSearchPlaceholder(), target.getSearchPlaceholder()));
        target.setPolicyText(coalesce(vo.getPolicyText(), target.getPolicyText()));
        target.setCustomerCenterText(coalesce(vo.getCustomerCenterText(), target.getCustomerCenterText()));
        return publicSiteConfigRepository.save(target);
    }

    public HealthBoxDealerPublicResponse getDealerMallPublicConfig(String slug) {
        DealerPublicView dealerPublicView = getActiveDealerPublicViewBySlug(slug);
        return toDealerPublicResponse(dealerPublicView.getDealerMall(), dealerPublicView.getPublicConfig());
    }

    public HealthBoxDealerMallPublicConfigVo getDealerMallPublicConfigByDealerMallId(Long dealerMallId) {
        return dealerMallPublicConfigRepository.findByDealerMallId(dealerMallId)
            .orElseThrow(() -> new IllegalArgumentException("dealer mall public config not found. dealerMallId=" + dealerMallId));
    }

    public HealthBoxPublicSiteConfigVo getDealerMallSiteConfig(Long dealerMallId) {
        HealthBoxDealerMallPublicConfigVo dealer = getDealerMallPublicConfigByDealerMallId(dealerMallId);
        HealthBoxPublicSiteConfigVo hq = getPublicSiteConfig();
        HealthBoxPublicSiteConfigVo merged = new HealthBoxPublicSiteConfigVo();
        merged.setId(dealer.getId());
        merged.setLogoUrl(coalesce(dealer.getLogoUrl(), hq.getLogoUrl()));
        merged.setFaviconUrl(coalesce(dealer.getFaviconUrl(), hq.getFaviconUrl()));
        merged.setMainVisualUrl(coalesce(dealer.getMainVisualUrl(), hq.getMainVisualUrl()));
        merged.setMainVisualLinkUrl(coalesce(dealer.getMainVisualLinkUrl(), hq.getMainVisualLinkUrl()));
        merged.setMiddleBannerUrl(coalesce(dealer.getMiddleBannerUrl(), hq.getMiddleBannerUrl()));
        merged.setMiddleBannerLinkUrl(coalesce(dealer.getMiddleBannerLinkUrl(), hq.getMiddleBannerLinkUrl()));
        merged.setShareThumbnailUrl(coalesce(dealer.getShareThumbnailUrl(), hq.getShareThumbnailUrl()));
        merged.setMetaTitle(coalesce(dealer.getMetaTitle(), hq.getMetaTitle()));
        merged.setMetaDescription(coalesce(dealer.getMetaDescription(), hq.getMetaDescription()));
        merged.setMainNavigationJson(coalesce(dealer.getMainNavigationJson(), hq.getMainNavigationJson()));
        merged.setSearchPlaceholder(coalesce(dealer.getSearchPlaceholder(), hq.getSearchPlaceholder()));
        merged.setPolicyText(coalesce(dealer.getPolicyText(), hq.getPolicyText()));
        merged.setCustomerCenterText(coalesce(dealer.getCustomerCenterText(), hq.getCustomerCenterText()));
        return merged;
    }

    @Transactional
    public HealthBoxDealerMallPublicConfigVo saveDealerMallPublicConfig(Long dealerMallId, HealthBoxDealerMallPublicConfigVo vo) {
        HealthBoxDealerMallVo dealerMall = dealerMallRepository.findById(dealerMallId)
            .orElseThrow(() -> new IllegalArgumentException("dealer mall not found. id=" + dealerMallId));

        HealthBoxDealerMallPublicConfigVo target = dealerMallPublicConfigRepository.findByDealerMallId(dealerMallId)
            .orElseGet(HealthBoxDealerMallPublicConfigVo::new);

        String mallName = StringUtils.hasText(vo.getMallName()) ? vo.getMallName() : coalesce(target.getMallName(), dealerMall.getMallName());
        String displayName = StringUtils.hasText(vo.getDisplayName()) ? vo.getDisplayName() : coalesce(target.getDisplayName(), dealerMall.getDisplayName());
        String supportEmail = StringUtils.hasText(vo.getSupportEmail()) ? vo.getSupportEmail() : coalesce(target.getSupportEmail(), dealerMall.getSupportEmail());
        String supportPhone = StringUtils.hasText(vo.getSupportPhone()) ? vo.getSupportPhone() : coalesce(target.getSupportPhone(), dealerMall.getSupportPhone());

        target.setDealerMallId(dealerMallId);
        target.setSlug(dealerMall.getSlug());
        target.setMallName(mallName);
        target.setDisplayName(displayName);
        target.setSupportEmail(normalizeEmail(supportEmail));
        target.setSupportPhone(normalizePhone(supportPhone));
        target.setActiveYn(StringUtils.hasText(vo.getActiveYn()) ? vo.getActiveYn() : coalesce(target.getActiveYn(), "Y"));
        target.setLogoUrl(coalesce(vo.getLogoUrl(), target.getLogoUrl()));
        target.setFaviconUrl(coalesce(vo.getFaviconUrl(), target.getFaviconUrl()));
        if (vo.getMainVisualUrl() != null) {
            target.setMainVisualUrl(StringUtils.hasText(vo.getMainVisualUrl()) ? vo.getMainVisualUrl().trim() : null);
        }
        if (vo.getMainVisualLinkUrl() != null) {
            target.setMainVisualLinkUrl(normalizeStorefrontLink(vo.getMainVisualLinkUrl()));
        }
        if (vo.getMiddleBannerUrl() != null) {
            target.setMiddleBannerUrl(StringUtils.hasText(vo.getMiddleBannerUrl()) ? vo.getMiddleBannerUrl().trim() : null);
        }
        if (vo.getMiddleBannerLinkUrl() != null) {
            target.setMiddleBannerLinkUrl(normalizeStorefrontLink(vo.getMiddleBannerLinkUrl()));
        }
        target.setShareThumbnailUrl(coalesce(vo.getShareThumbnailUrl(), target.getShareThumbnailUrl()));
        target.setMetaTitle(coalesce(vo.getMetaTitle(), target.getMetaTitle()));
        target.setMetaDescription(coalesce(vo.getMetaDescription(), target.getMetaDescription()));
        target.setMainNavigationJson(coalesce(vo.getMainNavigationJson(), target.getMainNavigationJson()));
        target.setSearchPlaceholder(coalesce(vo.getSearchPlaceholder(), target.getSearchPlaceholder()));
        target.setPolicyText(coalesce(vo.getPolicyText(), target.getPolicyText()));
        target.setCustomerCenterText(coalesce(vo.getCustomerCenterText(), target.getCustomerCenterText()));

        dealerMall.setMallName(mallName);
        dealerMall.setDisplayName(displayName);
        dealerMall.setSupportEmail(normalizeEmail(supportEmail));
        dealerMall.setSupportPhone(normalizePhone(supportPhone));
        dealerMallRepository.save(dealerMall);

        return dealerMallPublicConfigRepository.save(target);
    }

    @Transactional
    public HealthBoxDealerMallPublicConfigVo saveDealerMallSiteConfig(Long dealerMallId, HealthBoxPublicSiteConfigVo vo) {
        HealthBoxDealerMallPublicConfigVo request = new HealthBoxDealerMallPublicConfigVo();
        request.setLogoUrl(vo.getLogoUrl());
        request.setFaviconUrl(vo.getFaviconUrl());
        request.setMainVisualUrl(vo.getMainVisualUrl());
        request.setMainVisualLinkUrl(vo.getMainVisualLinkUrl());
        request.setMiddleBannerUrl(vo.getMiddleBannerUrl());
        request.setMiddleBannerLinkUrl(vo.getMiddleBannerLinkUrl());
        request.setShareThumbnailUrl(vo.getShareThumbnailUrl());
        request.setMetaTitle(vo.getMetaTitle());
        request.setMetaDescription(vo.getMetaDescription());
        request.setMainNavigationJson(vo.getMainNavigationJson());
        request.setSearchPlaceholder(vo.getSearchPlaceholder());
        request.setPolicyText(vo.getPolicyText());
        request.setCustomerCenterText(vo.getCustomerCenterText());
        return saveDealerMallPublicConfig(dealerMallId, request);
    }

    private HealthBoxAccountVo resolveOrCreateDealerAdminAccount(HealthBoxDealerApplicationVo application) {
        HealthBoxAccountVo existingAccount = null;
        String normalizedEmail = normalizeEmail(application.getEmail());
        String normalizedPhone = normalizePhone(application.getPhone());
        HealthBoxAccountVo accountByEmail = StringUtils.hasText(normalizedEmail) ? accountRepository.findByEmail(normalizedEmail).orElse(null) : null;
        HealthBoxAccountVo accountByPhone = StringUtils.hasText(normalizedPhone) ? accountRepository.findByPhone(normalizedPhone).orElse(null) : null;

        if (accountByEmail != null && accountByPhone != null && !accountByEmail.getId().equals(accountByPhone.getId())) {
            throw new IllegalArgumentException("email and phone point to different existing accounts");
        }

        existingAccount = accountByEmail != null ? accountByEmail : accountByPhone;

        if (existingAccount != null) {
            validateReusableDealerAdminAccount(existingAccount, normalizedEmail, normalizedPhone);
            existingAccount.setStatus("ACTIVE");
            existingAccount = accountRepository.save(existingAccount);
            return existingAccount;
        }

        HealthBoxAccountVo account = new HealthBoxAccountVo();
        account.setName(application.getApplicantName());
        account.setPhone(normalizedPhone);
        account.setEmail(normalizedEmail);
        account.setStatus("ACTIVE");
        account.setAuthIdentifier("dealer-admin-" + application.getId());
        return accountRepository.save(account);
    }

    private void ensureDealerAdminRole(Long accountId, Long dealerMallId) {
        if (accountRoleRepository.findByAccountIdAndRoleAndDealerMallId(accountId, "DEALER_ADMIN", dealerMallId).isPresent()) {
            return;
        }

        HealthBoxAccountRoleVo accountRole = new HealthBoxAccountRoleVo();
        accountRole.setAccountId(accountId);
        accountRole.setRole("DEALER_ADMIN");
        accountRole.setDealerMallId(dealerMallId);
        accountRole.setStatus("ACTIVE");
        accountRoleRepository.save(accountRole);
    }

    private HealthBoxBuyerMemberVo findExistingBuyerMember(HealthBoxBuyerSignupApplicationVo application) {
        HealthBoxBuyerMemberVo existingByPhone = buyerMemberRepository
            .findByDealerMallIdAndPhone(application.getDealerMallId(), normalizePhone(application.getPhone()))
            .orElse(null);
        if (existingByPhone != null) {
            return existingByPhone;
        }

        if (StringUtils.hasText(application.getEmail())) {
            return buyerMemberRepository.findByDealerMallIdAndEmail(application.getDealerMallId(), normalizeEmail(application.getEmail())).orElse(null);
        }

        return null;
    }

    private String duplicateBuyerIdentityMessage(HealthBoxBuyerMemberVo buyerMember, String normalizedEmail) {
        if (StringUtils.hasText(normalizedEmail)
            && normalizedEmail.equalsIgnoreCase(normalizeEmail(buyerMember.getEmail()))) {
            return "이미 가입된 이메일입니다. 로그인 후 이용해주세요.";
        }
        return "이미 가입된 휴대폰 번호입니다. 로그인 후 이용해주세요.";
    }

    private void validateManualDealerRequest(HealthBoxAdminDealerCreateRequest request) {
        if (!StringUtils.hasText(request.getApplicantName())) {
            throw new IllegalArgumentException("applicantName is required");
        }
        if (!StringUtils.hasText(request.getMallName())) {
            throw new IllegalArgumentException("mallName is required");
        }
        if (!StringUtils.hasText(request.getSlug())) {
            throw new IllegalArgumentException("slug is required");
        }
        validateApprovalIdentity(normalizeEmail(request.getEmail()), normalizePhone(request.getPhone()), "dealer create request");
    }

    private Long resolveOrCreateBuyerAccount(HealthBoxBuyerSignupApplicationVo application, HealthBoxBuyerMemberVo buyerMember) {
        String normalizedPhone = normalizePhone(application.getPhone());
        String normalizedEmail = normalizeEmail(application.getEmail());
        HealthBoxAccountVo account = buyerMember.getAccountId() != null
            ? accountRepository.findById(buyerMember.getAccountId()).orElse(null)
            : null;

        if (account == null) {
            if (!StringUtils.hasText(application.getPasswordHash())) {
                throw new IllegalArgumentException("buyer signup application password is required");
            }

            account = new HealthBoxAccountVo();
            account.setStatus("ACTIVE");
        }

        account.setName(application.getName());
        account.setPhone(normalizedPhone);
        account.setEmail(normalizedEmail);
        account.setStatus("ACTIVE");
        if (StringUtils.hasText(application.getPasswordHash())) {
            account.setPasswordHash(application.getPasswordHash());
        }
        return accountRepository.save(account).getId();
    }

    private HealthBoxBuyerMemberVo findBuyerMemberForLogin(Long dealerMallId, String loginId) {
        String normalizedLoginId = loginId.trim();
        String normalizedPhone = normalizePhone(normalizedLoginId);
        String normalizedEmail = normalizeEmail(normalizedLoginId);

        if (StringUtils.hasText(normalizedPhone)) {
            HealthBoxBuyerMemberVo byPhone = buyerMemberRepository.findByDealerMallIdAndPhone(dealerMallId, normalizedPhone).orElse(null);
            if (byPhone != null) {
                return byPhone;
            }
        }

        if (StringUtils.hasText(normalizedEmail)) {
            return buyerMemberRepository.findByDealerMallIdAndEmail(dealerMallId, normalizedEmail).orElse(null);
        }

        return null;
    }

    private HealthBoxAccountVo resolveExistingBuyerAccount(HealthBoxBuyerMemberVo buyerMember, String normalizedPhone, String normalizedEmail) {
        if (buyerMember.getAccountId() != null) {
            return accountRepository.findById(buyerMember.getAccountId()).orElse(null);
        }

        HealthBoxAccountVo accountByEmail = StringUtils.hasText(normalizedEmail) ? accountRepository.findByEmail(normalizedEmail).orElse(null) : null;
        HealthBoxAccountVo accountByPhone = StringUtils.hasText(normalizedPhone) ? accountRepository.findByPhone(normalizedPhone).orElse(null) : null;

        if (accountByEmail != null && accountByPhone != null && !accountByEmail.getId().equals(accountByPhone.getId())) {
            throw new IllegalArgumentException("buyer email and phone point to different existing accounts");
        }

        HealthBoxAccountVo existingAccount = accountByEmail != null ? accountByEmail : accountByPhone;
        if (existingAccount != null) {
            validateReusableBuyerAccount(existingAccount, buyerMember.getDealerMallId(), normalizedEmail, normalizedPhone);
        }
        return existingAccount;
    }

    private void validateReusableBuyerAccount(HealthBoxAccountVo account, Long dealerMallId, String normalizedEmail, String normalizedPhone) {
        String accountEmail = normalizeEmail(account.getEmail());
        String accountPhone = normalizePhone(account.getPhone());
        boolean emailMatches = StringUtils.hasText(normalizedEmail) && normalizedEmail.equalsIgnoreCase(accountEmail);
        boolean phoneMatches = StringUtils.hasText(normalizedPhone) && normalizedPhone.equals(accountPhone);

        if (!emailMatches && !phoneMatches) {
            throw new IllegalArgumentException("existing buyer account identity does not match");
        }
        HealthBoxBuyerMemberVo linkedBuyerMember = buyerMemberRepository
            .findByAccountIdAndDealerMallId(account.getId(), dealerMallId)
            .orElse(null);
        if (linkedBuyerMember != null && !dealerMallId.equals(linkedBuyerMember.getDealerMallId())) {
            throw new IllegalArgumentException("existing buyer account belongs to different dealer mall");
        }
    }

    private boolean hasPrivilegedRoles(Long accountId) {
        List<HealthBoxAccountRoleVo> roles = accountRoleRepository.findByAccountId(accountId);
        return roles != null && !roles.isEmpty();
    }

    private HealthBoxBuyerSignupApplicationVo findExistingPendingBuyerSignupApplication(Long dealerMallId, String normalizedPhone, String normalizedEmail) {
        if (StringUtils.hasText(normalizedPhone)) {
            HealthBoxBuyerSignupApplicationVo existingByPhone = buyerSignupApplicationRepository
                .findTopByDealerMallIdAndPhoneAndStatusOrderByIdDesc(dealerMallId, normalizedPhone, "PENDING")
                .orElse(null);
            if (existingByPhone != null) {
                return existingByPhone;
            }
        }

        if (StringUtils.hasText(normalizedEmail)) {
            return buyerSignupApplicationRepository
                .findTopByDealerMallIdAndEmailAndStatusOrderByIdDesc(dealerMallId, normalizedEmail, "PENDING")
                .orElse(null);
        }

        return null;
    }

    private HealthBoxDealerMallVo resolveActiveDealerMallForSignup(HealthBoxBuyerSignupCreateRequest request) {
        if (request.getDealerMallId() != null) {
            HealthBoxDealerMallVo dealerMall = dealerMallRepository.findById(request.getDealerMallId())
                .orElseThrow(() -> new IllegalArgumentException("dealer mall not found. id=" + request.getDealerMallId()));
            validateDealerMallPublicAvailability(dealerMall);
            return dealerMall;
        }

        if (StringUtils.hasText(request.getSlug())) {
            return getActiveDealerPublicViewBySlug(request.getSlug()).getDealerMall();
        }

        throw new IllegalArgumentException("dealerMallId or slug is required");
    }

    private void validateDealerMallPublicAvailability(HealthBoxDealerMallVo dealerMall) {
        if (!"ACTIVE".equalsIgnoreCase(dealerMall.getStatus()) && !"APPROVED".equalsIgnoreCase(dealerMall.getStatus())) {
            throw new IllegalArgumentException("dealer mall is inactive. id=" + dealerMall.getId());
        }

        HealthBoxDealerMallPublicConfigVo publicConfig = dealerMallPublicConfigRepository.findByDealerMallId(dealerMall.getId())
            .orElseThrow(() -> new IllegalArgumentException("dealer mall public config not found. id=" + dealerMall.getId()));

        if (!"Y".equalsIgnoreCase(publicConfig.getActiveYn())) {
            throw new IllegalArgumentException("dealer mall public config is inactive. id=" + dealerMall.getId());
        }
    }

    private String resolveInboundChannel(HealthBoxBuyerSignupCreateRequest request) {
        if (StringUtils.hasText(request.getSlug())) {
            return "subdomain";
        }

        return "manual";
    }

    private void validateBuyerPassword(String password) {
        if (!StringUtils.hasText(password)) {
            throw new IllegalArgumentException("password is required");
        }
        if (password.trim().length() < 8) {
            throw new IllegalArgumentException("password must be at least 8 characters");
        }
    }

    private void validateBuyerSignupConsent(HealthBoxBuyerSignupCreateRequest request) {
        if (request.getBirthDate() == null) {
            throw new IllegalArgumentException("생년월일을 입력해주세요.");
        }

        LocalDate today = LocalDate.now();
        if (request.getBirthDate().isAfter(today)) {
            throw new IllegalArgumentException("생년월일을 정확히 입력해주세요.");
        }
        if (request.getBirthDate().plusYears(14).isAfter(today)) {
            throw new IllegalArgumentException("만 14세 미만은 회원가입할 수 없습니다.");
        }
        if (!Boolean.TRUE.equals(request.getTermsAgreed())) {
            throw new IllegalArgumentException("이용약관 동의가 필요합니다.");
        }
        if (!Boolean.TRUE.equals(request.getPrivacyAgreed())) {
            throw new IllegalArgumentException("개인정보 수집·이용 동의가 필요합니다.");
        }
        if (!Boolean.TRUE.equals(request.getThirdPartyAgreed())) {
            throw new IllegalArgumentException("개인정보 제3자 제공 동의가 필요합니다.");
        }
        if (!BUYER_SIGNUP_CONSENT_VERSION.equals(request.getConsentDocumentVersion())) {
            throw new IllegalArgumentException("개인정보 동의 문안 버전을 확인해주세요.");
        }
    }

    private void applyBuyerSignupConsent(
        HealthBoxBuyerSignupApplicationVo application,
        HealthBoxBuyerSignupCreateRequest request,
        LocalDateTime consentedAt
    ) {
        application.setBirthDate(request.getBirthDate());
        application.setTermsAgreedAt(consentedAt);
        application.setPrivacyAgreedAt(consentedAt);
        application.setThirdPartyAgreedAt(consentedAt);
        application.setMarketingConsentYn(Boolean.TRUE.equals(request.getMarketingAgreed()) ? "Y" : "N");
        application.setMarketingConsentUpdatedAt(consentedAt);
        application.setConsentDocumentVersion(BUYER_SIGNUP_CONSENT_VERSION);
    }

    private HealthBoxDealerMallVo resolveActiveDealerMallForLogin(HealthBoxBuyerLoginRequest request) {
        if (request.getDealerMallId() != null) {
            HealthBoxDealerMallVo dealerMall = dealerMallRepository.findById(request.getDealerMallId())
                .orElseThrow(() -> new IllegalArgumentException("dealer mall not found. id=" + request.getDealerMallId()));
            validateDealerMallPublicAvailability(dealerMall);
            return dealerMall;
        }

        if (StringUtils.hasText(request.getHost())) {
            String normalizedHost = normalizeHost(request.getHost());
            if (isHqMallHost(normalizedHost)) {
                throw new IllegalArgumentException("dealerMallId or slug is required for dealer mall login");
            }

            if (normalizedHost.endsWith(ROOT_DOMAIN)) {
                String slug = normalizedHost.substring(0, normalizedHost.length() - ROOT_DOMAIN.length());
                return getActiveDealerPublicViewBySlug(slug).getDealerMall();
            }
        }

        if (StringUtils.hasText(request.getSlug())) {
            return getActiveDealerPublicViewBySlug(request.getSlug()).getDealerMall();
        }

        throw new IllegalArgumentException("dealerMallId or slug is required");
    }

    private HealthBoxDealerMallVo resolveActiveDealerMallForPasswordReset(HealthBoxBuyerPasswordResetRequest request) {
        if (request.getDealerMallId() != null) {
            HealthBoxDealerMallVo dealerMall = dealerMallRepository.findById(request.getDealerMallId())
                .orElseThrow(() -> new IllegalArgumentException("dealer mall not found. id=" + request.getDealerMallId()));
            validateDealerMallPublicAvailability(dealerMall);
            return dealerMall;
        }

        if (StringUtils.hasText(request.getHost())) {
            String normalizedHost = normalizeHost(request.getHost());
            if (isHqMallHost(normalizedHost)) {
                throw new IllegalArgumentException("dealerMallId or slug is required for dealer mall password reset");
            }

            if (normalizedHost.endsWith(ROOT_DOMAIN)) {
                String slug = normalizedHost.substring(0, normalizedHost.length() - ROOT_DOMAIN.length());
                return getActiveDealerPublicViewBySlug(slug).getDealerMall();
            }
        }

        if (StringUtils.hasText(request.getSlug())) {
            return getActiveDealerPublicViewBySlug(request.getSlug()).getDealerMall();
        }

        throw new IllegalArgumentException("dealerMallId or slug is required");
    }

    private boolean isHqMallLogin(HealthBoxBuyerLoginRequest request) {
        if (request == null) {
            return false;
        }

        if (Boolean.TRUE.equals(request.getHqMall())) {
            return true;
        }

        return StringUtils.hasText(request.getHost()) && isHqMallHost(normalizeHost(request.getHost()));
    }

    private boolean isHqMallSignup(HealthBoxBuyerSignupCreateRequest request) {
        if (request == null) {
            return false;
        }

        if (request.getDealerMallId() != null && request.getDealerMallId() == HQ_BUYER_DEALER_MALL_ID) {
            return true;
        }

        return "hq-public".equalsIgnoreCase(request.getInboundChannel());
    }

    private boolean isHqBuyerApplication(HealthBoxBuyerSignupApplicationVo application) {
        return application != null &&
            (application.getDealerMallId() != null && application.getDealerMallId() == HQ_BUYER_DEALER_MALL_ID ||
                "hq-public".equalsIgnoreCase(application.getInboundChannel()));
    }

    private boolean isHqMallPasswordReset(HealthBoxBuyerPasswordResetRequest request) {
        if (request == null) {
            return false;
        }

        if (Boolean.TRUE.equals(request.getHqMall())) {
            return true;
        }

        return StringUtils.hasText(request.getHost()) && isHqMallHost(normalizeHost(request.getHost()));
    }

    private boolean isHqMallHost(String host) {
        return ROOT_HOST.equals(host) || WWW_ROOT_HOST.equals(host);
    }

    private HealthBoxBuyerMemberVo resolvePasswordResetBuyerMember(
        HealthBoxDealerMallVo dealerMall,
        boolean hqMallReset,
        String name,
        String normalizedPhone,
        String normalizedEmail
    ) {
        if (StringUtils.hasText(normalizedEmail)) {
            HealthBoxBuyerMemberVo memberByEmail = hqMallReset
                ? findActiveBuyerMemberByEmail(normalizedEmail, name, normalizedPhone)
                : findActiveBuyerMemberByDealerMallAndEmail(dealerMall.getId(), normalizedEmail, name, normalizedPhone);
            if (memberByEmail != null) {
                return memberByEmail;
            }
        }

        if (StringUtils.hasText(normalizedPhone)) {
            return hqMallReset
                ? findActiveBuyerMemberByPhone(normalizedPhone, name, normalizedEmail)
                : findActiveBuyerMemberByDealerMallAndPhone(dealerMall.getId(), normalizedPhone, name, normalizedEmail);
        }

        return null;
    }

    private HealthBoxBuyerMemberVo findActiveBuyerMemberByDealerMallAndPhone(
        Long dealerMallId,
        String normalizedPhone,
        String name,
        String normalizedEmail
    ) {
        HealthBoxBuyerMemberVo member = buyerMemberRepository.findByDealerMallIdAndPhone(dealerMallId, normalizedPhone).orElse(null);
        return isPasswordResetBuyerMemberMatch(member, name, normalizedPhone, normalizedEmail) ? member : null;
    }

    private HealthBoxBuyerMemberVo findActiveBuyerMemberByDealerMallAndEmail(
        Long dealerMallId,
        String normalizedEmail,
        String name,
        String normalizedPhone
    ) {
        HealthBoxBuyerMemberVo member = buyerMemberRepository.findByDealerMallIdAndEmail(dealerMallId, normalizedEmail).orElse(null);
        return isPasswordResetBuyerMemberMatch(member, name, normalizedPhone, normalizedEmail) ? member : null;
    }

    private HealthBoxBuyerMemberVo findActiveBuyerMemberByPhone(String normalizedPhone, String name, String normalizedEmail) {
        for (HealthBoxBuyerMemberVo member : buyerMemberRepository.findByPhoneOrderByIdDesc(normalizedPhone)) {
            if (isPasswordResetBuyerMemberMatch(member, name, normalizedPhone, normalizedEmail)) {
                return member;
            }
        }
        return null;
    }

    private HealthBoxBuyerMemberVo findActiveBuyerMemberByEmail(String normalizedEmail, String name, String normalizedPhone) {
        for (HealthBoxBuyerMemberVo member : buyerMemberRepository.findByEmailOrderByIdDesc(normalizedEmail)) {
            if (isPasswordResetBuyerMemberMatch(member, name, normalizedPhone, normalizedEmail)) {
                return member;
            }
        }
        return null;
    }

    private boolean isPasswordResetBuyerMemberMatch(
        HealthBoxBuyerMemberVo member,
        String name,
        String normalizedPhone,
        String normalizedEmail
    ) {
        if (member == null || !"ACTIVE".equalsIgnoreCase(member.getStatus())) {
            return false;
        }
        if (!name.equals(member.getName())) {
            return false;
        }
        if (StringUtils.hasText(normalizedPhone) && !normalizedPhone.equals(normalizePhone(member.getPhone()))) {
            return false;
        }
        return !StringUtils.hasText(normalizedEmail) || normalizedEmail.equalsIgnoreCase(normalizeEmail(member.getEmail()));
    }

    private HealthBoxAccountVo resolvePasswordResetAccount(HealthBoxBuyerMemberVo buyerMember) {
        if (buyerMember == null || buyerMember.getAccountId() == null) {
            throw new IllegalArgumentException("buyer account not found");
        }

        HealthBoxAccountVo account = accountRepository.findById(buyerMember.getAccountId())
            .orElseThrow(() -> new IllegalArgumentException("buyer account not found"));
        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new IllegalArgumentException("buyer account not found");
        }
        return account;
    }

    private boolean isBuyerPasswordAccepted(HealthBoxAccountVo account, String rawPassword) {
        if (account == null || !StringUtils.hasText(rawPassword)) {
            return false;
        }

        if (StringUtils.hasText(account.getPasswordHash()) && passwordEncoder.matches(rawPassword, account.getPasswordHash())) {
            return true;
        }

        HealthBoxBuyerMemberVo buyerMember = buyerMemberRepository.findByAccountId(account.getId()).orElse(null);
        if (buyerMember == null) {
            return false;
        }

        HealthBoxBuyerSignupApplicationVo approvedApplication = null;
        String normalizedPhone = normalizePhone(buyerMember.getPhone());
        String normalizedEmail = normalizeEmail(buyerMember.getEmail());

        if (StringUtils.hasText(normalizedPhone)) {
            approvedApplication = buyerSignupApplicationRepository
                .findTopByDealerMallIdAndPhoneAndStatusOrderByIdDesc(buyerMember.getDealerMallId(), normalizedPhone, "APPROVED")
                .orElse(null);
        }

        if (approvedApplication == null && StringUtils.hasText(normalizedEmail)) {
            approvedApplication = buyerSignupApplicationRepository
                .findTopByDealerMallIdAndEmailAndStatusOrderByIdDesc(buyerMember.getDealerMallId(), normalizedEmail, "APPROVED")
                .orElse(null);
        }

        if (approvedApplication == null || !StringUtils.hasText(approvedApplication.getPasswordHash())) {
            return false;
        }

        if (!passwordEncoder.matches(rawPassword, approvedApplication.getPasswordHash())) {
            return false;
        }

        account.setPasswordHash(approvedApplication.getPasswordHash());
        accountRepository.save(account);
        return true;
    }

    private HealthBoxAccountVo findBuyerAccount(String loginId) {
        String normalizedLoginId = loginId.trim();
        String normalizedPhone = normalizePhone(normalizedLoginId);
        String normalizedEmail = normalizeEmail(normalizedLoginId);

        if (StringUtils.hasText(normalizedPhone)) {
            HealthBoxAccountVo byPhone = accountRepository.findByPhone(normalizedPhone).orElse(null);
            if (byPhone != null) {
                return byPhone;
            }
        }

        if (StringUtils.hasText(normalizedEmail)) {
            return accountRepository.findByEmail(normalizedEmail).orElse(null);
        }

        return null;
    }

    private void validateReusableDealerAdminAccount(HealthBoxAccountVo account, String email, String phone) {
        if (StringUtils.hasText(email) && !email.equalsIgnoreCase(normalizeEmail(account.getEmail()))) {
            throw new IllegalArgumentException("existing account email does not match application");
        }

        if (StringUtils.hasText(phone) && !phone.equals(normalizePhone(account.getPhone()))) {
            throw new IllegalArgumentException("existing account phone does not match application");
        }

        List<HealthBoxAccountRoleVo> existingRoles = accountRoleRepository.findByAccountId(account.getId());
        if (existingRoles == null || existingRoles.isEmpty()) {
            return;
        }

        throw new IllegalArgumentException("existing account already has assigned roles. accountId=" + account.getId());
    }

    private DealerPublicView getActiveDealerPublicViewBySlug(String slug) {
        String normalizedSlug = normalizeSlug(slug);
        HealthBoxDealerMallVo dealerMall = dealerMallRepository.findBySlug(normalizedSlug)
            .orElseThrow(() -> new IllegalArgumentException("dealer mall not found. slug=" + slug));

        if (!"ACTIVE".equalsIgnoreCase(dealerMall.getStatus()) && !"APPROVED".equalsIgnoreCase(dealerMall.getStatus())) {
            throw new IllegalArgumentException("dealer mall is inactive. slug=" + normalizedSlug);
        }

        HealthBoxDealerMallPublicConfigVo publicConfig = dealerMallPublicConfigRepository.findByDealerMallId(dealerMall.getId())
            .orElseThrow(() -> new IllegalArgumentException("dealer mall public config not found. slug=" + slug));

        if (!"Y".equalsIgnoreCase(publicConfig.getActiveYn())) {
            throw new IllegalArgumentException("dealer mall public config is inactive. slug=" + normalizedSlug);
        }

        return new DealerPublicView(dealerMall, publicConfig);
    }

    private String coalesce(String first, String second) {
        return StringUtils.hasText(first) ? first : second;
    }

    private String normalizeHost(String host) {
        if (!StringUtils.hasText(host)) {
            return null;
        }

        String normalized = host.trim().toLowerCase();
        int portIndex = normalized.indexOf(':');
        if (portIndex >= 0) {
            normalized = normalized.substring(0, portIndex);
        }
        return normalized;
    }

    private HealthBoxBuyerMemberVo resolveBuyerMemberFromApplication(HealthBoxBuyerSignupApplicationVo application) {
        HealthBoxBuyerMemberVo buyerMember = buyerMemberRepository.findById(application.getBuyerMemberId()).orElse(null);
        if (buyerMember == null) {
            return null;
        }

        if (!application.getDealerMallId().equals(buyerMember.getDealerMallId())) {
            throw new IllegalArgumentException("buyerMemberId belongs to different dealer mall");
        }

        boolean samePhone = StringUtils.hasText(application.getPhone()) && normalizePhone(application.getPhone()).equals(normalizePhone(buyerMember.getPhone()));
        boolean sameEmail = StringUtils.hasText(application.getEmail()) && normalizeEmail(application.getEmail()).equals(normalizeEmail(buyerMember.getEmail()));
        if (!samePhone && !sameEmail) {
            throw new IllegalArgumentException("buyerMemberId does not match application identity");
        }

        return buyerMember;
    }

    private String normalizeSlug(String slug) {
        return slug == null ? null : slug.trim().toLowerCase();
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }

        String digitsOnly = phone.replaceAll("[^0-9]", "");
        return digitsOnly.isEmpty() ? null : digitsOnly;
    }

    private void validateApprovalIdentity(String normalizedEmail, String normalizedPhone, String targetName) {
        if (!StringUtils.hasText(normalizedEmail) && !StringUtils.hasText(normalizedPhone)) {
            throw new IllegalArgumentException(targetName + " requires at least one identity field(email or phone)");
        }
    }

    private void validateDealerSlug(String slug) {
        if (!StringUtils.hasText(slug)) {
            throw new IllegalArgumentException("slug is empty");
        }

        if ("admin".equals(slug) || "www".equals(slug)) {
            throw new IllegalArgumentException("reserved slug is not allowed. slug=" + slug);
        }

        if (slug.contains(".")) {
            throw new IllegalArgumentException("only one subdomain level is allowed. slug=" + slug);
        }

        if (!slug.matches("^[a-z0-9-]+$")) {
            throw new IllegalArgumentException("slug contains invalid characters. slug=" + slug);
        }
    }

    private String generateDealerCode(Long applicationId) {
        return String.format("HB-%06d", applicationId);
    }

    private String generateManualDealerCode(String slug) {
        return "HBM-" + slug.replaceAll("[^a-z0-9]", "").toUpperCase();
    }

    private String resolveNoticeSlug(HealthBoxNoticeVo target, HealthBoxNoticeSaveRequest request) {
        if (StringUtils.hasText(request.getSlug())) {
            return request.getSlug().trim();
        }

        if (StringUtils.hasText(target.getSlug())) {
            return target.getSlug();
        }

        return generateNoticeSlug(request.getTitle());
    }

    private String generateNoticeSlug(String title) {
        String base = title == null ? "notice" : title.trim().toLowerCase();
        base = base.replaceAll("[^a-z0-9가-힣]+", "-").replaceAll("^-+|-+$", "");
        if (!StringUtils.hasText(base)) {
            base = "notice";
        }
        return base + "-" + System.currentTimeMillis();
    }

    private void applyNoticeStatus(HealthBoxNoticeVo target, HealthBoxNoticeSaveRequest request) {
        boolean pinned = request.getPinned() != null && request.getPinned();
        String status = StringUtils.hasText(request.getStatus()) ? request.getStatus().trim() : "게시중";

        if ("임시 저장".equals(status) || "DRAFT".equalsIgnoreCase(status)) {
            target.setPostStatus("DRAFT");
            target.setPinnedYn("N");
            return;
        }

        if ("상단 고정".equals(status) || pinned) {
            target.setPostStatus("POSTED");
            target.setPinnedYn("Y");
            if (target.getPostedAt() == null) {
                target.setPostedAt(LocalDateTime.now());
            }
            return;
        }

        target.setPostStatus("POSTED");
        target.setPinnedYn("N");
        if (target.getPostedAt() == null) {
            target.setPostedAt(LocalDateTime.now());
        }
    }

    private void syncProductMedia(Long productId, List<HealthBoxProductMediaRequest> mediaItems) {
        productMediaRepository.deleteByProductId(productId);
        if (mediaItems == null || mediaItems.isEmpty()) {
            return;
        }

        for (HealthBoxProductMediaRequest mediaItem : mediaItems) {
            if (mediaItem == null || !StringUtils.hasText(mediaItem.getMediaUrl())) {
                continue;
            }

            HealthBoxProductMediaVo media = new HealthBoxProductMediaVo();
            media.setProductId(productId);
            media.setMediaType(StringUtils.hasText(mediaItem.getMediaType()) ? mediaItem.getMediaType().trim() : "IMAGE");
            media.setMediaUrl(mediaItem.getMediaUrl().trim());
            media.setSortOrder(mediaItem.getSortOrder());
            media.setAltText(mediaItem.getAltText());
            productMediaRepository.save(media);
        }
    }

    private HealthBoxProductDetailResponse buildProductDetailResponse(HealthBoxProductVo product) {
        List<HealthBoxProductMediaResponse> mediaItems = productMediaRepository.findByProductIdOrderBySortOrderAscIdAsc(product.getId()).stream()
            .map(this::buildProductMediaResponse)
            .collect(Collectors.toList());

        HealthBoxProductDetailResponse response = new HealthBoxProductDetailResponse();
        copyProductFields(product, response);
        response.setThumbnailUrl(resolveThumbnailUrl(mediaItems));
        response.setMediaItems(mediaItems);
        response.setOptionGroups(buildProductOptionGroupResponses(product.getId()));
        response.setSkus(buildProductSkuResponses(product.getId()));
        return response;
    }

    private HealthBoxCategoryResponse buildCategoryResponse(HealthBoxCategoryVo category) {
        HealthBoxCategoryResponse response = new HealthBoxCategoryResponse();
        response.setId(category.getId());
        response.setName(category.getName());
        response.setSlug(category.getSlug());
        response.setCategoryCode(category.getCategoryCode());
        response.setSortOrder(category.getSortOrder());
        response.setStatus(category.getStatus());
        response.setDeletedYn(category.getDeletedYn());
        response.setDeletedAt(category.getDeletedAt());
        response.setCreatedAt(category.getCreatedAt());
        response.setUpdatedAt(category.getUpdatedAt());
        return response;
    }

    private HealthBoxProductSummaryResponse buildProductSummaryResponse(HealthBoxProductVo product) {
        List<HealthBoxProductMediaResponse> mediaItems = productMediaRepository.findByProductIdOrderBySortOrderAscIdAsc(product.getId()).stream()
            .map(this::buildProductMediaResponse)
            .collect(Collectors.toList());
        HealthBoxCategoryVo category = product.getCategoryId() != null ? categoryRepository.findById(product.getCategoryId()).orElse(null) : null;

        HealthBoxProductSummaryResponse response = new HealthBoxProductSummaryResponse();
        response.setId(product.getId());
        response.setName(product.getName());
        response.setProductCode(product.getProductCode());
        response.setSlug(product.getSlug());
        response.setBrandName(product.getBrandName());
        response.setCategoryId(product.getCategoryId());
        response.setCategoryName(category != null ? category.getName() : null);
        response.setCategoryCode(category != null ? category.getCategoryCode() : null);
        response.setStatus(product.getStatus());
        response.setPublishStatus(product.getPublishStatus());
        response.setOptionUseYn(product.getOptionUseYn());
        response.setConsumerPrice(product.getConsumerPrice());
        response.setMemberPrice(product.getMemberPrice());
        response.setSortOrder(product.getSortOrder());
        response.setThumbnailUrl(resolveThumbnailUrl(mediaItems));
        response.setTotalStockQuantity(calculateTotalStockQuantity(product.getId()));
        response.setDeletedYn(product.getDeletedYn());
        response.setDeletedAt(product.getDeletedAt());
        response.setCreatedAt(product.getCreatedAt());
        response.setUpdatedAt(product.getUpdatedAt());
        return response;
    }

    private HealthBoxDealerProductSummaryResponse buildDealerProductSummaryResponse(HealthBoxProductVo product) {
        List<HealthBoxProductMediaResponse> mediaItems = productMediaRepository.findByProductIdOrderBySortOrderAscIdAsc(product.getId()).stream()
            .map(this::buildProductMediaResponse)
            .collect(Collectors.toList());
        HealthBoxCategoryVo category = product.getCategoryId() != null ? categoryRepository.findById(product.getCategoryId()).orElse(null) : null;

        HealthBoxDealerProductSummaryResponse response = new HealthBoxDealerProductSummaryResponse();
        response.setId(product.getId());
        response.setName(product.getName());
        response.setSlug(product.getSlug());
        response.setBrandName(product.getBrandName());
        response.setCategoryId(product.getCategoryId());
        response.setCategoryName(category != null ? category.getName() : null);
        response.setCategoryCode(category != null ? category.getCategoryCode() : null);
        response.setSummaryText(product.getSummaryText());
        response.setOptionUseYn(product.getOptionUseYn());
        response.setConsumerPrice(product.getConsumerPrice());
        response.setMemberPrice(product.getMemberPrice());
        response.setThumbnailUrl(resolveThumbnailUrl(mediaItems));
        response.setTotalStockQuantity(calculateTotalStockQuantity(product.getId()));
        response.setSoldOut(isProductSoldOut(product.getId()));
        return response;
    }

    private HealthBoxDealerProductDetailResponse buildDealerProductDetailResponse(HealthBoxProductVo product) {
        List<HealthBoxProductMediaResponse> mediaItems = productMediaRepository.findByProductIdOrderBySortOrderAscIdAsc(product.getId()).stream()
            .map(this::buildProductMediaResponse)
            .collect(Collectors.toList());
        HealthBoxCategoryVo category = product.getCategoryId() != null ? categoryRepository.findById(product.getCategoryId()).orElse(null) : null;

        HealthBoxDealerProductDetailResponse response = new HealthBoxDealerProductDetailResponse();
        response.setId(product.getId());
        response.setName(product.getName());
        response.setSlug(product.getSlug());
        response.setBrandName(product.getBrandName());
        response.setCategoryId(product.getCategoryId());
        response.setCategoryName(category != null ? category.getName() : null);
        response.setCategoryCode(category != null ? category.getCategoryCode() : null);
        response.setSummaryText(product.getSummaryText());
        response.setOptionUseYn(product.getOptionUseYn());
        response.setConsumerPrice(product.getConsumerPrice());
        response.setMemberPrice(product.getMemberPrice());
        response.setSalesPolicyText(product.getSalesPolicyText());
        response.setDeliveryPolicyText(product.getDeliveryPolicyText());
        response.setDetailHtml(product.getDetailHtml());
        response.setThumbnailUrl(resolveThumbnailUrl(mediaItems));
        response.setTotalStockQuantity(calculateTotalStockQuantity(product.getId()));
        response.setSoldOut(isProductSoldOut(product.getId()));
        response.setMediaItems(mediaItems);
        response.setOptionGroups(buildProductOptionGroupResponses(product.getId()));
        response.setSkus(buildPublicProductSkuResponses(product.getId()));
        return response;
    }

    private void copyProductFields(HealthBoxProductVo product, HealthBoxProductDetailResponse response) {
        HealthBoxSalesPolicyVo salesPolicy = product.getSalesPolicyId() != null ? salesPolicyRepository.findById(product.getSalesPolicyId()).orElse(null) : null;
        HealthBoxDeliveryPolicyVo deliveryPolicy = product.getDeliveryPolicyId() != null ? deliveryPolicyRepository.findById(product.getDeliveryPolicyId()).orElse(null) : null;
        HealthBoxCategoryVo category = product.getCategoryId() != null ? categoryRepository.findById(product.getCategoryId()).orElse(null) : null;

        response.setId(product.getId());
        response.setName(product.getName());
        response.setProductCode(product.getProductCode());
        response.setSlug(product.getSlug());
        response.setBrandName(product.getBrandName());
        response.setCategoryId(product.getCategoryId());
        response.setCategoryName(category != null ? category.getName() : null);
        response.setCategoryCode(category != null ? category.getCategoryCode() : null);
        response.setStatus(product.getStatus());
        response.setPublishStatus(product.getPublishStatus());
        response.setOptionUseYn(product.getOptionUseYn());
        response.setSummaryText(product.getSummaryText());
        response.setSalesPolicyId(product.getSalesPolicyId());
        response.setSalesPolicyTitle(salesPolicy != null ? salesPolicy.getTitle() : null);
        response.setSalesPolicyText(product.getSalesPolicyText());
        response.setDeliveryPolicyId(product.getDeliveryPolicyId());
        response.setDeliveryPolicyTitle(deliveryPolicy != null ? deliveryPolicy.getTitle() : null);
        response.setDeliveryPolicyText(product.getDeliveryPolicyText());
        response.setDetailHtml(product.getDetailHtml());
        response.setSortOrder(product.getSortOrder());
        response.setConsumerPrice(product.getConsumerPrice());
        response.setMemberPrice(product.getMemberPrice());
        response.setSupplyPrice(product.getSupplyPrice());
        response.setSettlementBasePrice(product.getSettlementBasePrice());
        response.setPriceExposurePolicy(product.getPriceExposurePolicy());
        response.setDeletedYn(product.getDeletedYn());
        response.setDeletedAt(product.getDeletedAt());
        response.setCreatedAt(product.getCreatedAt());
        response.setUpdatedAt(product.getUpdatedAt());
    }

    private List<HealthBoxProductSkuResponse> buildPublicProductSkuResponses(Long productId) {
        return buildProductSkuResponses(productId).stream()
            .filter(sku -> !"Y".equalsIgnoreCase(sku.getSoldOutYn()))
            .filter(sku -> "ACTIVE".equalsIgnoreCase(sku.getStatus()))
            .filter(sku -> (sku.getStockQuantity() != null ? sku.getStockQuantity() : 0) > 0)
            .collect(Collectors.toList());
    }

    private HealthBoxProductMediaResponse buildProductMediaResponse(HealthBoxProductMediaVo media) {
        HealthBoxProductMediaResponse response = new HealthBoxProductMediaResponse();
        response.setId(media.getId());
        response.setMediaType(media.getMediaType());
        response.setMediaUrl(media.getMediaUrl());
        response.setSortOrder(media.getSortOrder());
        response.setAltText(media.getAltText());
        return response;
    }

    private void syncProductOptionsAndSkus(HealthBoxProductVo product, HealthBoxProductSaveRequest request) {
        clearProductOptionStructure(product.getId());

        if (!"Y".equalsIgnoreCase(product.getOptionUseYn())) {
            createDefaultSku(product, request.getSkus());
            return;
        }

        List<HealthBoxProductOptionGroupRequest> optionGroups = request.getOptionGroups();
        if (optionGroups == null || optionGroups.isEmpty()) {
            throw new IllegalArgumentException("optionUseYn is Y but optionGroups are empty");
        }

        Map<String, HealthBoxProductOptionValueVo> valueByCode = createOptionGroups(product.getId(), optionGroups);
        List<HealthBoxProductSkuRequest> skuRequests = request.getSkus();
        if (skuRequests == null || skuRequests.isEmpty()) {
            throw new IllegalArgumentException("optionUseYn is Y but skus are empty");
        }

        createSkus(product, skuRequests, valueByCode);
    }

    private void clearProductOptionStructure(Long productId) {
        List<HealthBoxProductSkuVo> existingSkus = productSkuRepository.findByProductIdOrderByIdAsc(productId);
        if (!existingSkus.isEmpty()) {
            List<Long> skuIds = existingSkus.stream().map(HealthBoxProductSkuVo::getId).collect(Collectors.toList());
            List<HealthBoxProductSkuOptionVo> skuOptions = productSkuOptionRepository.findBySkuIdIn(skuIds);
            if (!skuOptions.isEmpty()) {
                productSkuOptionRepository.deleteAll(skuOptions);
            }
            productSkuRepository.deleteAll(existingSkus);
        }

        List<HealthBoxProductOptionValueVo> existingValues = productOptionValueRepository.findByProductIdOrderBySortOrderAscIdAsc(productId);
        if (!existingValues.isEmpty()) {
            productOptionValueRepository.deleteAll(existingValues);
        }

        List<HealthBoxProductOptionGroupVo> existingGroups = productOptionGroupRepository.findByProductIdOrderBySortOrderAscIdAsc(productId);
        if (!existingGroups.isEmpty()) {
            productOptionGroupRepository.deleteAll(existingGroups);
        }
    }

    private Map<String, HealthBoxProductOptionValueVo> createOptionGroups(Long productId, List<HealthBoxProductOptionGroupRequest> optionGroups) {
        Map<String, HealthBoxProductOptionValueVo> valueByCode = new HashMap<>();
        Set<String> globalCodes = new HashSet<>();
        int groupIndex = 0;

        for (HealthBoxProductOptionGroupRequest groupRequest : optionGroups) {
            if (groupRequest == null || !StringUtils.hasText(groupRequest.getGroupName())) {
                continue;
            }

            HealthBoxProductOptionGroupVo group = new HealthBoxProductOptionGroupVo();
            group.setProductId(productId);
            group.setGroupName(groupRequest.getGroupName().trim());
            group.setSortOrder(groupRequest.getSortOrder() != null ? groupRequest.getSortOrder() : groupIndex + 1);
            group.setRequiredYn(StringUtils.hasText(groupRequest.getRequiredYn()) ? groupRequest.getRequiredYn().trim() : "Y");
            group = productOptionGroupRepository.save(group);

            List<HealthBoxProductOptionValueRequest> values = groupRequest.getValues();
            if (values == null || values.isEmpty()) {
                throw new IllegalArgumentException("option group values are required. group=" + group.getGroupName());
            }

            Set<String> localCodes = new HashSet<>();
            int valueIndex = 0;
            for (HealthBoxProductOptionValueRequest valueRequest : values) {
                if (valueRequest == null || !StringUtils.hasText(valueRequest.getValueName())) {
                    continue;
                }

                String valueCode = buildOptionValueCode(valueRequest.getValueCode(), valueRequest.getValueName(), groupIndex, valueIndex, localCodes);
                if (!globalCodes.add(valueCode)) {
                    throw new IllegalArgumentException("duplicate option value code in product. code=" + valueCode);
                }
                HealthBoxProductOptionValueVo value = new HealthBoxProductOptionValueVo();
                value.setProductId(productId);
                value.setOptionGroupId(group.getId());
                value.setValueName(valueRequest.getValueName().trim());
                value.setValueCode(valueCode);
                value.setSortOrder(valueRequest.getSortOrder() != null ? valueRequest.getSortOrder() : valueIndex + 1);
                value.setStatus(StringUtils.hasText(valueRequest.getStatus()) ? valueRequest.getStatus().trim() : "ACTIVE");
                value = productOptionValueRepository.save(value);
                valueByCode.put(valueCode, value);
                valueIndex++;
            }
            groupIndex++;
        }

        if (valueByCode.isEmpty()) {
            throw new IllegalArgumentException("product option values are empty");
        }
        return valueByCode;
    }

    private void createSkus(
        HealthBoxProductVo product,
        List<HealthBoxProductSkuRequest> skuRequests,
        Map<String, HealthBoxProductOptionValueVo> valueByCode
    ) {
        Set<String> usedSkuCodes = new HashSet<>();

        for (HealthBoxProductSkuRequest skuRequest : skuRequests) {
            if (skuRequest == null) {
                continue;
            }

            List<String> optionValueCodes = skuRequest.getOptionValueCodes() == null
                ? Collections.emptyList()
                : skuRequest.getOptionValueCodes().stream()
                    .filter(StringUtils::hasText)
                    .map(code -> code.trim().toUpperCase(Locale.ROOT))
                    .collect(Collectors.toList());

            if (optionValueCodes.isEmpty()) {
                throw new IllegalArgumentException("sku optionValueCodes are required when optionUseYn is Y");
            }
            if (skuRequest.getStockQuantity() != null && skuRequest.getStockQuantity() < 0) {
                throw new IllegalArgumentException("sku stockQuantity cannot be negative");
            }
            if (skuRequest.getSafetyStock() != null && skuRequest.getSafetyStock() < 0) {
                throw new IllegalArgumentException("sku safetyStock cannot be negative");
            }

            String skuCode = resolveSkuCode(product.getProductCode(), skuRequest.getSkuCode(), optionValueCodes, usedSkuCodes);
            HealthBoxProductSkuVo sku = new HealthBoxProductSkuVo();
            sku.setProductId(product.getId());
            sku.setSkuCode(skuCode);
            sku.setSkuName(StringUtils.hasText(skuRequest.getSkuName()) ? skuRequest.getSkuName().trim() : buildSkuName(product.getName(), optionValueCodes, valueByCode));
            sku.setStatus(StringUtils.hasText(skuRequest.getStatus()) ? skuRequest.getStatus().trim() : "ACTIVE");
            sku.setConsumerPrice(skuRequest.getConsumerPrice() != null ? skuRequest.getConsumerPrice() : product.getConsumerPrice());
            sku.setMemberPrice(skuRequest.getMemberPrice() != null ? skuRequest.getMemberPrice() : product.getMemberPrice());
            sku.setSupplyPrice(skuRequest.getSupplyPrice() != null ? skuRequest.getSupplyPrice() : product.getSupplyPrice());
            sku.setSettlementBasePrice(skuRequest.getSettlementBasePrice() != null ? skuRequest.getSettlementBasePrice() : product.getSettlementBasePrice());
            sku.setStockQuantity(skuRequest.getStockQuantity() != null ? skuRequest.getStockQuantity() : 0);
            sku.setSafetyStock(skuRequest.getSafetyStock() != null ? skuRequest.getSafetyStock() : 0);
            sku.setSoldOutYn(StringUtils.hasText(skuRequest.getSoldOutYn()) ? skuRequest.getSoldOutYn().trim() : "N");
            sku = productSkuRepository.save(sku);
            usedSkuCodes.add(skuCode);

            for (String optionValueCode : optionValueCodes) {
                HealthBoxProductOptionValueVo optionValue = valueByCode.get(optionValueCode);
                if (optionValue == null) {
                    throw new IllegalArgumentException("option value code not found for sku. code=" + optionValueCode);
                }

                HealthBoxProductSkuOptionVo skuOption = new HealthBoxProductSkuOptionVo();
                skuOption.setSkuId(sku.getId());
                skuOption.setOptionGroupId(optionValue.getOptionGroupId());
                skuOption.setOptionValueId(optionValue.getId());
                productSkuOptionRepository.save(skuOption);
            }
        }

        if (usedSkuCodes.isEmpty()) {
            throw new IllegalArgumentException("skus are empty");
        }
    }

    private void createDefaultSku(HealthBoxProductVo product, List<HealthBoxProductSkuRequest> skuRequests) {
        HealthBoxProductSkuRequest skuRequest =
            (skuRequests != null && !skuRequests.isEmpty()) ? skuRequests.get(0) : null;
        if (skuRequest != null && skuRequest.getStockQuantity() != null && skuRequest.getStockQuantity() < 0) {
            throw new IllegalArgumentException("sku stockQuantity cannot be negative");
        }
        if (skuRequest != null && skuRequest.getSafetyStock() != null && skuRequest.getSafetyStock() < 0) {
            throw new IllegalArgumentException("sku safetyStock cannot be negative");
        }

        String requestedSkuCode = StringUtils.hasText(skuRequest != null ? skuRequest.getSkuCode() : null)
            ? skuRequest.getSkuCode().trim().toUpperCase(Locale.ROOT)
            : null;
        String skuCode = StringUtils.hasText(requestedSkuCode) ? requestedSkuCode : product.getProductCode() + "-DEFAULT";
        if (productSkuRepository.findBySkuCode(skuCode).isPresent()) {
            throw new IllegalArgumentException("sku code already exists. skuCode=" + skuCode);
        }

        HealthBoxProductSkuVo sku = new HealthBoxProductSkuVo();
        sku.setProductId(product.getId());
        sku.setSkuCode(skuCode);
        sku.setSkuName(StringUtils.hasText(skuRequest != null ? skuRequest.getSkuName() : null)
            ? skuRequest.getSkuName().trim()
            : product.getName());
        sku.setStatus(StringUtils.hasText(skuRequest != null ? skuRequest.getStatus() : null)
            ? skuRequest.getStatus().trim()
            : "ACTIVE");
        sku.setConsumerPrice(skuRequest != null && skuRequest.getConsumerPrice() != null ? skuRequest.getConsumerPrice() : product.getConsumerPrice());
        sku.setMemberPrice(skuRequest != null && skuRequest.getMemberPrice() != null ? skuRequest.getMemberPrice() : product.getMemberPrice());
        sku.setSupplyPrice(skuRequest != null && skuRequest.getSupplyPrice() != null ? skuRequest.getSupplyPrice() : product.getSupplyPrice());
        sku.setSettlementBasePrice(skuRequest != null && skuRequest.getSettlementBasePrice() != null ? skuRequest.getSettlementBasePrice() : product.getSettlementBasePrice());
        sku.setStockQuantity(skuRequest != null && skuRequest.getStockQuantity() != null ? skuRequest.getStockQuantity() : 0);
        sku.setSafetyStock(skuRequest != null && skuRequest.getSafetyStock() != null ? skuRequest.getSafetyStock() : 0);
        sku.setSoldOutYn(StringUtils.hasText(skuRequest != null ? skuRequest.getSoldOutYn() : null)
            ? skuRequest.getSoldOutYn().trim()
            : "N");
        productSkuRepository.save(sku);
    }

    private List<HealthBoxProductOptionGroupResponse> buildProductOptionGroupResponses(Long productId) {
        List<HealthBoxProductOptionGroupVo> groups = productOptionGroupRepository.findByProductIdOrderBySortOrderAscIdAsc(productId);
        List<HealthBoxProductOptionValueVo> values = productOptionValueRepository.findByProductIdOrderBySortOrderAscIdAsc(productId);
        Map<Long, List<HealthBoxProductOptionValueVo>> valuesByGroupId = values.stream()
            .collect(Collectors.groupingBy(HealthBoxProductOptionValueVo::getOptionGroupId));

        List<HealthBoxProductOptionGroupResponse> responses = new ArrayList<>();
        for (HealthBoxProductOptionGroupVo group : groups) {
            HealthBoxProductOptionGroupResponse response = new HealthBoxProductOptionGroupResponse();
            response.setId(group.getId());
            response.setGroupName(group.getGroupName());
            response.setSortOrder(group.getSortOrder());
            response.setRequiredYn(group.getRequiredYn());
            response.setValues(valuesByGroupId.getOrDefault(group.getId(), Collections.emptyList()).stream()
                .sorted(Comparator.comparing(HealthBoxProductOptionValueVo::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(HealthBoxProductOptionValueVo::getId))
                .map(this::buildProductOptionValueResponse)
                .collect(Collectors.toList()));
            responses.add(response);
        }
        return responses;
    }

    private List<HealthBoxProductSkuResponse> buildProductSkuResponses(Long productId) {
        List<HealthBoxProductSkuVo> skus = productSkuRepository.findByProductIdOrderByIdAsc(productId);
        List<Long> skuIds = skus.stream().map(HealthBoxProductSkuVo::getId).collect(Collectors.toList());
        List<HealthBoxProductSkuOptionVo> skuOptions = skuIds.isEmpty() ? Collections.emptyList() : productSkuOptionRepository.findBySkuIdIn(skuIds);
        List<HealthBoxProductOptionValueVo> optionValues = productOptionValueRepository.findByProductIdOrderBySortOrderAscIdAsc(productId);

        Map<Long, String> valueCodeById = optionValues.stream()
            .collect(Collectors.toMap(HealthBoxProductOptionValueVo::getId, HealthBoxProductOptionValueVo::getValueCode));
        Map<Long, List<HealthBoxProductSkuOptionVo>> skuOptionsBySkuId = skuOptions.stream()
            .collect(Collectors.groupingBy(HealthBoxProductSkuOptionVo::getSkuId));

        List<HealthBoxProductSkuResponse> responses = new ArrayList<>();
        for (HealthBoxProductSkuVo sku : skus) {
            List<String> optionValueCodes = skuOptionsBySkuId.getOrDefault(sku.getId(), Collections.emptyList()).stream()
                .sorted(Comparator.comparing(HealthBoxProductSkuOptionVo::getOptionGroupId))
                .map(option -> valueCodeById.get(option.getOptionValueId()))
                .filter(StringUtils::hasText)
                .collect(Collectors.toList());
            responses.add(buildProductSkuResponse(sku, optionValueCodes));
        }
        return responses;
    }

    private HealthBoxProductSkuResponse buildProductSkuResponse(HealthBoxProductSkuVo sku, List<String> optionValueCodes) {
        HealthBoxProductSkuResponse response = new HealthBoxProductSkuResponse();
        response.setId(sku.getId());
        response.setSkuCode(sku.getSkuCode());
        response.setSkuName(sku.getSkuName());
        response.setStatus(sku.getStatus());
        response.setConsumerPrice(sku.getConsumerPrice());
        response.setMemberPrice(sku.getMemberPrice());
        response.setSupplyPrice(sku.getSupplyPrice());
        response.setSettlementBasePrice(sku.getSettlementBasePrice());
        response.setStockQuantity(sku.getStockQuantity());
        response.setSafetyStock(sku.getSafetyStock());
        response.setSoldOutYn(sku.getSoldOutYn());
        response.setOptionValueCodes(optionValueCodes);
        return response;
    }

    private HealthBoxProductOptionValueResponse buildProductOptionValueResponse(HealthBoxProductOptionValueVo value) {
        HealthBoxProductOptionValueResponse response = new HealthBoxProductOptionValueResponse();
        response.setId(value.getId());
        response.setValueName(value.getValueName());
        response.setValueCode(value.getValueCode());
        response.setSortOrder(value.getSortOrder());
        response.setStatus(value.getStatus());
        return response;
    }

    private Integer calculateTotalStockQuantity(Long productId) {
        return productSkuRepository.findByProductIdOrderByIdAsc(productId).stream()
            .map(HealthBoxProductSkuVo::getStockQuantity)
            .filter(java.util.Objects::nonNull)
            .reduce(0, Integer::sum);
    }

    private boolean isProductSoldOut(Long productId) {
        return productSkuRepository.findByProductIdOrderByIdAsc(productId).stream()
            .filter(sku -> !"Y".equalsIgnoreCase(sku.getDeletedYn()))
            .filter(sku -> "ACTIVE".equalsIgnoreCase(sku.getStatus()))
            .noneMatch(sku ->
                !"Y".equalsIgnoreCase(sku.getSoldOutYn()) &&
                (sku.getStockQuantity() != null ? sku.getStockQuantity() : 0) > 0
            );
    }

    private List<String> findOptionValueCodesBySkuId(Long skuId) {
        List<HealthBoxProductSkuOptionVo> skuOptions = productSkuOptionRepository.findBySkuIdIn(Collections.singletonList(skuId));
        if (skuOptions.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> optionValueIds = skuOptions.stream()
            .map(HealthBoxProductSkuOptionVo::getOptionValueId)
            .collect(Collectors.toSet());

        Map<Long, HealthBoxProductOptionValueVo> optionValueById = productOptionValueRepository.findAllById(optionValueIds).stream()
            .collect(Collectors.toMap(HealthBoxProductOptionValueVo::getId, value -> value));

        return skuOptions.stream()
            .sorted(Comparator.comparing(HealthBoxProductSkuOptionVo::getOptionGroupId))
            .map(option -> optionValueById.get(option.getOptionValueId()))
            .filter(java.util.Objects::nonNull)
            .map(HealthBoxProductOptionValueVo::getValueCode)
            .filter(StringUtils::hasText)
            .collect(Collectors.toList());
    }

    private List<String> findOptionValueNamesBySkuId(Long skuId) {
        List<HealthBoxProductSkuOptionVo> skuOptions = productSkuOptionRepository.findBySkuIdIn(Collections.singletonList(skuId));
        if (skuOptions.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> optionValueIds = skuOptions.stream()
            .map(HealthBoxProductSkuOptionVo::getOptionValueId)
            .collect(Collectors.toSet());

        Map<Long, HealthBoxProductOptionValueVo> optionValueById = productOptionValueRepository.findAllById(optionValueIds).stream()
            .collect(Collectors.toMap(HealthBoxProductOptionValueVo::getId, value -> value));

        return skuOptions.stream()
            .sorted(Comparator.comparing(HealthBoxProductSkuOptionVo::getOptionGroupId))
            .map(option -> optionValueById.get(option.getOptionValueId()))
            .filter(java.util.Objects::nonNull)
            .map(HealthBoxProductOptionValueVo::getValueName)
            .filter(StringUtils::hasText)
            .collect(Collectors.toList());
    }

    private void validateOrderableSku(HealthBoxProductVo product, HealthBoxProductSkuVo sku, Integer quantity) {
        if ("Y".equalsIgnoreCase(product.getDeletedYn())) {
            throw new IllegalArgumentException("product is deleted. productId=" + product.getId());
        }
        if ("Y".equalsIgnoreCase(sku.getDeletedYn())) {
            throw new IllegalArgumentException("sku is deleted. skuId=" + sku.getId());
        }
        if (!"ACTIVE".equalsIgnoreCase(product.getStatus())) {
            throw new IllegalArgumentException("product is inactive. productId=" + product.getId());
        }
        if (!"ACTIVE".equalsIgnoreCase(sku.getStatus())) {
            throw new IllegalArgumentException("sku is inactive. skuId=" + sku.getId());
        }
        if ("Y".equalsIgnoreCase(sku.getSoldOutYn())) {
            throw new IllegalArgumentException("sku is sold out. skuId=" + sku.getId());
        }
        int stockQuantity = sku.getStockQuantity() != null ? sku.getStockQuantity() : 0;
        if (stockQuantity < quantity) {
            throw new IllegalArgumentException("insufficient sku stock. skuId=" + sku.getId());
        }
    }

    private void validateDealerVisibleProduct(HealthBoxProductVo product) {
        if ("Y".equalsIgnoreCase(product.getDeletedYn())) {
            throw new IllegalArgumentException("product is deleted. productId=" + product.getId());
        }
        if (!"ACTIVE".equalsIgnoreCase(product.getStatus())) {
            throw new IllegalArgumentException("product is inactive. productId=" + product.getId());
        }
        String publishStatus = StringUtils.hasText(product.getPublishStatus()) ? product.getPublishStatus().trim() : "";
        if ("삭제됨".equalsIgnoreCase(publishStatus) ||
            "비노출".equalsIgnoreCase(publishStatus) ||
            "미노출".equalsIgnoreCase(publishStatus) ||
            "판매중지".equalsIgnoreCase(publishStatus)) {
            throw new IllegalArgumentException("product is not visible. productId=" + product.getId());
        }
        HealthBoxCategoryVo category = resolveActiveCategory(product.getCategoryId());
        if (category == null) {
            throw new IllegalArgumentException("product category is invalid. productId=" + product.getId());
        }
    }

    private int resolveOrderPrice(HealthBoxProductVo product, HealthBoxProductSkuVo sku) {
        if (sku.getMemberPrice() != null && sku.getMemberPrice() > 0) {
            return sku.getMemberPrice();
        }
        if (sku.getConsumerPrice() != null && sku.getConsumerPrice() > 0) {
            return sku.getConsumerPrice();
        }
        if (product.getMemberPrice() != null && product.getMemberPrice() > 0) {
            return product.getMemberPrice();
        }
        if (product.getConsumerPrice() != null && product.getConsumerPrice() > 0) {
            return product.getConsumerPrice();
        }
        return 0;
    }

    private String buildOrderItemOptionSummary(Long skuId) {
        List<String> optionNames = findOptionValueNamesBySkuId(skuId);
        if (optionNames.isEmpty()) {
            return null;
        }
        return String.join(" / ", optionNames);
    }

    private String resolveOrderItemOptionSummary(HealthBoxOrderCreateItemRequest itemRequest, Long skuId) {
        String requestedOptionSummary = normalizeOrderItemOptionSummary(itemRequest.getOptionSummarySnapshot());
        if (requestedOptionSummary != null) {
            return requestedOptionSummary;
        }
        return buildOrderItemOptionSummary(skuId);
    }

    private String normalizeOrderItemOptionSummary(String optionSummary) {
        if (optionSummary == null) {
            return null;
        }
        String trimmed = optionSummary.trim();
        if (trimmed.isEmpty() || "상품".equals(trimmed) || "기본 상품".equals(trimmed)) {
            return null;
        }
        return trimmed;
    }

    private String generateOrderNo(LocalDateTime orderedAt) {
        LocalDateTime baseDateTime = orderedAt != null ? orderedAt : LocalDateTime.now();
        LocalDateTime startOfDay = baseDateTime.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        long sequence = orderRepository.countByOrderedAtBetween(startOfDay, endOfDay) + 1;
        if (sequence > 9999) {
            throw new IllegalStateException("daily order sequence exceeded. date=" + baseDateTime.toLocalDate());
        }
        return baseDateTime.format(DateTimeFormatter.BASIC_ISO_DATE) + String.format("%04d", sequence);
    }

    private HealthBoxOrderDetailResponse buildOrderDetailResponse(HealthBoxOrderVo order) {
        HealthBoxShipmentVo shipment = shipmentRepository.findByOrderId(order.getId()).orElse(null);
        List<HealthBoxOrderItemVo> items = orderItemRepository.findByOrderIdOrderByIdAsc(order.getId());
        return buildOrderDetailResponse(order, shipment, items);
    }

    private HealthBoxOrderDetailResponse buildOrderDetailResponse(
        HealthBoxOrderVo order,
        HealthBoxShipmentVo shipment,
        List<HealthBoxOrderItemVo> items
    ) {
        HealthBoxOrderDetailResponse response = new HealthBoxOrderDetailResponse();
        response.setId(order.getId());
        response.setOrderNo(order.getOrderNo());
        response.setBuyerMemberId(order.getBuyerMemberId());
        response.setDealerMallId(order.getDealerMallId());
        response.setDealerSlugSnapshot(order.getDealerSlugSnapshot());
        response.setDealerNameSnapshot(order.getDealerNameSnapshot());
        response.setOrdererName(order.getOrdererName());
        response.setOrdererPhone(order.getOrdererPhone());
        response.setReceiverName(order.getReceiverName());
        response.setReceiverPhone(order.getReceiverPhone());
        response.setZipCode(order.getZipCode());
        response.setBaseAddress(order.getBaseAddress());
        response.setDetailAddress(order.getDetailAddress());
        response.setProductAmount(order.getProductAmount());
        response.setShippingFee(order.getShippingFee());
        response.setDiscountAmount(order.getDiscountAmount());
        response.setTotalPaymentAmount(order.getTotalPaymentAmount());
        response.setRemainingPaymentAmount(order.getRemainingPaymentAmount());
        response.setCanceledPaymentAmount(order.getCanceledPaymentAmount());
        response.setPaymentStatus(order.getPaymentStatus());
        response.setOrderStatus(order.getOrderStatus());
        response.setOrderedAt(order.getOrderedAt());
        HealthBoxPaymentVo payment = paymentRepository.findTopByOrderIdOrderByIdDesc(order.getId()).orElse(null);
        if (payment != null) {
            HealthBoxOrderPaymentResponse paymentResponse = buildOrderPaymentResponse(payment);
            response.setPayment(paymentResponse);
            response.setPaymentMethodName(payment.getPaymentMethodName());
            response.setPaymentProvider(payment.getProvider());
            response.setPaymentKey(payment.getPaymentKey());
            response.setPaymentOrderId(payment.getPaymentOrderId());
            response.setReceiptUrl(payment.getReceiptUrl());
        }
        if (shipment != null) {
            response.setShipmentId(shipment.getId());
            response.setShipmentStatus(shipment.getShipmentStatus());
            response.setCourierCompany(shipment.getCourierCompany());
            response.setTrackingNo(shipment.getTrackingNo());
            response.setShippedAt(shipment.getShippedAt());
            response.setDeliveredAt(shipment.getDeliveredAt());
        }
        response.setItems(items.stream().map(this::buildOrderItemResponse).collect(Collectors.toList()));
        return response;
    }

    private HealthBoxOrderDetailResponse findExistingOrderForPayment(
        HealthBoxOrderCreateRequest request,
        HealthBoxBuyerMemberVo buyerMember
    ) {
        HealthBoxOrderPaymentRequest paymentRequest = request.getPayment();
        if (paymentRequest == null) {
            return null;
        }

        String paymentOrderId = trimToNull(paymentRequest.getPaymentOrderId());
        String paymentKey = trimToNull(paymentRequest.getPaymentKey());
        HealthBoxPaymentVo byPaymentOrderId = paymentOrderId != null
            ? paymentRepository.findByPaymentOrderId(paymentOrderId).orElse(null)
            : null;
        HealthBoxPaymentVo byPaymentKey = paymentKey != null
            ? paymentRepository.findByPaymentKey(paymentKey).orElse(null)
            : null;

        if (byPaymentOrderId != null && byPaymentKey != null && !byPaymentOrderId.getId().equals(byPaymentKey.getId())) {
            throw new IllegalArgumentException("payment identifiers belong to different orders");
        }

        HealthBoxPaymentVo payment = byPaymentOrderId != null ? byPaymentOrderId : byPaymentKey;
        if (payment == null) {
            return null;
        }
        if (!buyerMember.getId().equals(payment.getBuyerMemberId()) || !request.getDealerMallId().equals(payment.getDealerMallId())) {
            throw new IllegalArgumentException("payment already belongs to another buyer order");
        }
        if (paymentOrderId != null && !paymentOrderId.equals(payment.getPaymentOrderId())) {
            throw new IllegalArgumentException("payment order id mismatch");
        }
        if (paymentKey != null && !paymentKey.equals(payment.getPaymentKey())) {
            throw new IllegalArgumentException("payment key mismatch");
        }

        HealthBoxOrderVo order = orderRepository.findById(payment.getOrderId())
            .orElseThrow(() -> new IllegalStateException("payment order header not found. orderId=" + payment.getOrderId()));
        return buildOrderDetailResponse(order);
    }

    private void validateConfirmedTossPayment(HealthBoxOrderCreateRequest request, int expectedAmount) {
        HealthBoxOrderPaymentRequest paymentRequest = request.getPayment();
        String provider = paymentRequest != null ? defaultText(paymentRequest.getProvider(), "") : "";
        if (
            paymentRequest == null || (
                !"TOSS".equalsIgnoreCase(provider)
                    && !"TOSS_TEST".equalsIgnoreCase(provider)
                    && !"TOSS_NOTITLE_TEMPORARY".equalsIgnoreCase(provider)
            )
        ) {
            throw new IllegalArgumentException("confirmed Toss payment is required");
        }

        String paymentKey = trimToNull(paymentRequest.getPaymentKey());
        String paymentOrderId = trimToNull(paymentRequest.getPaymentOrderId());
        if (paymentKey == null || paymentOrderId == null) {
            throw new IllegalArgumentException("Toss paymentKey and paymentOrderId are required");
        }
        if (paymentRequest.getPaidAmount() == null || paymentRequest.getPaidAmount() != expectedAmount) {
            throw new IllegalArgumentException("payment amount mismatch");
        }

        try {
            HealthBoxPaymentResponse payment = "TOSS_TEST".equalsIgnoreCase(provider)
                ? paymentService.getTestPayment(paymentKey)
                : paymentService.getLivePayment(paymentKey);
            if (
                payment == null ||
                !"DONE".equalsIgnoreCase(payment.getStatus()) ||
                !paymentKey.equals(payment.getPaymentKey()) ||
                !paymentOrderId.equals(payment.getOrderId()) ||
                payment.getTotalAmount() == null ||
                payment.getTotalAmount() != expectedAmount
            ) {
                throw new IllegalArgumentException("Toss payment verification failed");
            }
        } catch (IllegalArgumentException error) {
            throw error;
        } catch (Exception error) {
            throw new IllegalArgumentException("Toss payment verification failed", error);
        }
    }

    private void saveOrderPayment(HealthBoxOrderVo order, HealthBoxOrderPaymentRequest paymentRequest, int totalPaymentAmount) {
        if (paymentRequest != null && paymentRequest.getPaidAmount() != null && paymentRequest.getPaidAmount() > 0
            && paymentRequest.getPaidAmount() != totalPaymentAmount) {
            throw new IllegalArgumentException("payment amount mismatch. paidAmount=" + paymentRequest.getPaidAmount());
        }

        HealthBoxPaymentVo payment = new HealthBoxPaymentVo();
        payment.setOrderId(order.getId());
        payment.setBuyerMemberId(order.getBuyerMemberId());
        payment.setDealerMallId(order.getDealerMallId());
        payment.setOrderNo(order.getOrderNo());
        payment.setStatus(order.getPaymentStatus());
        payment.setPaidAmount(totalPaymentAmount);
        payment.setCanceledAmount(0);
        payment.setRemainingAmount(totalPaymentAmount);

        if (paymentRequest == null) {
            payment.setProvider("MANUAL");
            payment.setPaymentMethodName("결제수단 정보 없음");
            paymentRepository.save(payment);
            return;
        }

        payment.setProvider(defaultText(paymentRequest.getProvider(), "TOSS"));
        payment.setPaymentKey(trimToNull(paymentRequest.getPaymentKey()));
        payment.setPaymentOrderId(trimToNull(paymentRequest.getPaymentOrderId()));
        payment.setMethod(trimToNull(paymentRequest.getMethod()));
        payment.setMethodDetail(trimToNull(paymentRequest.getMethodDetail()));
        payment.setPaymentMethodName(defaultText(paymentRequest.getPaymentMethodName(), buildPaymentMethodName(paymentRequest)));
        payment.setApprovedAt(parsePaymentApprovedAt(paymentRequest.getApprovedAt()));
        payment.setReceiptUrl(trimToNull(paymentRequest.getReceiptUrl()));
        payment.setRawResponseJson(trimToNull(paymentRequest.getRawResponseJson()));
        paymentRepository.save(payment);
    }

    private void updatePaymentAfterCancellation(HealthBoxOrderVo order) {
        HealthBoxPaymentVo payment = paymentRepository.findTopByOrderIdOrderByIdDesc(order.getId()).orElse(null);
        if (payment == null) {
            return;
        }

        payment.setStatus(order.getPaymentStatus());
        payment.setPaidAmount(order.getTotalPaymentAmount() != null ? order.getTotalPaymentAmount() : 0);
        payment.setCanceledAmount(order.getCanceledPaymentAmount() != null ? order.getCanceledPaymentAmount() : 0);
        payment.setRemainingAmount(order.getRemainingPaymentAmount() != null ? order.getRemainingPaymentAmount() : 0);
        paymentRepository.save(payment);
    }

    private void cancelConfirmedTossPayment(
        HealthBoxOrderVo order,
        Integer cancelAmount,
        String requestId,
        String cancelReason
    ) {
        HealthBoxPaymentVo payment = paymentRepository.findTopByOrderIdOrderByIdDesc(order.getId()).orElse(null);
        if (
            payment == null || (
                !"TOSS".equalsIgnoreCase(payment.getProvider())
                    && !"TOSS_NOTITLE_TEMPORARY".equalsIgnoreCase(payment.getProvider())
            )
        ) {
            return;
        }
        if (!StringUtils.hasText(payment.getPaymentKey())) {
            throw new IllegalArgumentException("Toss paymentKey is missing for order. orderId=" + order.getId());
        }

        try {
            HealthBoxPaymentResponse canceledPayment = paymentService.cancelLivePayment(
                payment.getPaymentKey(),
                cancelReason,
                cancelAmount,
                requestId
            );
            String status = canceledPayment != null ? canceledPayment.getStatus() : null;
            if (!"CANCELED".equalsIgnoreCase(status) && !"PARTIAL_CANCELED".equalsIgnoreCase(status)) {
                throw new IllegalArgumentException("Toss cancellation did not complete. status=" + status);
            }
        } catch (IllegalArgumentException error) {
            throw error;
        } catch (Exception error) {
            throw new IllegalArgumentException("Toss payment cancellation failed", error);
        }
    }

    private HealthBoxOrderPaymentResponse buildOrderPaymentResponse(HealthBoxPaymentVo payment) {
        HealthBoxOrderPaymentResponse response = new HealthBoxOrderPaymentResponse();
        response.setId(payment.getId());
        response.setProvider(payment.getProvider());
        response.setPaymentKey(payment.getPaymentKey());
        response.setPaymentOrderId(payment.getPaymentOrderId());
        response.setMethod(payment.getMethod());
        response.setMethodDetail(payment.getMethodDetail());
        response.setPaymentMethodName(payment.getPaymentMethodName());
        response.setStatus(payment.getStatus());
        response.setApprovedAt(payment.getApprovedAt());
        response.setPaidAmount(payment.getPaidAmount());
        response.setCanceledAmount(payment.getCanceledAmount());
        response.setRemainingAmount(payment.getRemainingAmount());
        response.setReceiptUrl(payment.getReceiptUrl());
        return response;
    }

    private String buildPaymentMethodName(HealthBoxOrderPaymentRequest paymentRequest) {
        if (StringUtils.hasText(paymentRequest.getMethodDetail())) {
            return paymentRequest.getMethodDetail().trim();
        }
        if (StringUtils.hasText(paymentRequest.getMethod())) {
            return paymentRequest.getMethod().trim();
        }
        if (StringUtils.hasText(paymentRequest.getProvider())) {
            return paymentRequest.getProvider().trim();
        }
        return "결제수단 정보 없음";
    }

    private String defaultText(String value, String defaultValue) {
        return StringUtils.hasText(value) ? value.trim() : defaultValue;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private LocalDateTime parsePaymentApprovedAt(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String text = value.trim();
        try {
            return OffsetDateTime.parse(text).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            try {
                return LocalDateTime.parse(text);
            } catch (DateTimeParseException ignoredAgain) {
                return null;
            }
        }
    }

    private HealthBoxOrderItemResponse buildOrderItemResponse(HealthBoxOrderItemVo item) {
        HealthBoxOrderItemResponse response = new HealthBoxOrderItemResponse();
        response.setId(item.getId());
        response.setProductId(item.getProductId());
        response.setSkuId(item.getSkuId());
        response.setProductNameSnapshot(item.getProductNameSnapshot());
        response.setSkuCodeSnapshot(item.getSkuCodeSnapshot());
        response.setSkuNameSnapshot(item.getSkuNameSnapshot());
        response.setOptionSummarySnapshot(item.getOptionSummarySnapshot());
        response.setThumbnailUrl(resolveProductThumbnailUrl(item.getProductId()));
        response.setPriceSnapshot(item.getPriceSnapshot());
        response.setQuantity(item.getQuantity());
        response.setCanceledQuantity(item.getCanceledQuantity() != null ? item.getCanceledQuantity() : 0);
        response.setRemainingQuantity(getRemainingOrderItemQuantity(item));
        response.setLineAmount(item.getLineAmount());
        return response;
    }

    private HealthBoxBuyerAddressResponse buildBuyerAddressResponse(HealthBoxBuyerAddressVo address) {
        HealthBoxBuyerAddressResponse response = new HealthBoxBuyerAddressResponse();
        response.setId(address.getId());
        response.setBuyerMemberId(address.getBuyerMemberId());
        response.setAddressAlias(address.getAddressAlias());
        response.setReceiverName(address.getReceiverName());
        response.setReceiverPhone(address.getReceiverPhone());
        response.setZipCode(address.getZipCode());
        response.setBaseAddress(address.getBaseAddress());
        response.setDetailAddress(address.getDetailAddress());
        response.setDefaultYn(address.getDefaultYn());
        response.setCreatedAt(address.getCreatedAt());
        response.setUpdatedAt(address.getUpdatedAt());
        return response;
    }

    private void validateBuyerAddressRequest(HealthBoxBuyerAddressRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("address request is required");
        }
        if (!StringUtils.hasText(request.getReceiverName())) {
            throw new IllegalArgumentException("receiverName is required");
        }
        if (!StringUtils.hasText(request.getAddressAlias())) {
            throw new IllegalArgumentException("addressAlias is required");
        }
        if (!StringUtils.hasText(request.getReceiverPhone())) {
            throw new IllegalArgumentException("receiverPhone is required");
        }
        if (!StringUtils.hasText(request.getBaseAddress())) {
            throw new IllegalArgumentException("baseAddress is required");
        }
    }

    private void applyBuyerAddressRequest(HealthBoxBuyerAddressVo address, HealthBoxBuyerAddressRequest request) {
        address.setAddressAlias(request.getAddressAlias().trim());
        address.setReceiverName(request.getReceiverName().trim());
        address.setReceiverPhone(normalizePhone(request.getReceiverPhone()));
        address.setZipCode(StringUtils.hasText(request.getZipCode()) ? request.getZipCode().trim() : null);
        address.setBaseAddress(request.getBaseAddress().trim());
        address.setDetailAddress(StringUtils.hasText(request.getDetailAddress()) ? request.getDetailAddress().trim() : null);
        address.setDefaultYn("Y".equalsIgnoreCase(request.getDefaultYn()) ? "Y" : "N");
    }

    private void clearDefaultBuyerAddresses(Long buyerMemberId, Long exceptAddressId) {
        List<HealthBoxBuyerAddressVo> addresses = buyerAddressRepository.findByBuyerMemberIdOrderByIdDesc(buyerMemberId);
        for (HealthBoxBuyerAddressVo address : addresses) {
            if (exceptAddressId != null && exceptAddressId.equals(address.getId())) {
                continue;
            }
            if ("Y".equalsIgnoreCase(address.getDefaultYn())) {
                address.setDefaultYn("N");
                buyerAddressRepository.save(address);
            }
        }
    }

    private String resolveProductThumbnailUrl(Long productId) {
        if (productId == null) {
            return null;
        }

        List<HealthBoxProductMediaResponse> mediaItems = productMediaRepository.findByProductIdOrderBySortOrderAscIdAsc(productId).stream()
            .map(this::buildProductMediaResponse)
            .collect(Collectors.toList());
        return resolveThumbnailUrl(mediaItems);
    }

    private HealthBoxBuyerAddressVo resolveOrderAddress(HealthBoxOrderCreateRequest request, HealthBoxBuyerMemberVo buyerMember) {
        if (request.getBuyerAddressId() != null) {
            return buyerAddressRepository.findByIdAndBuyerMemberId(request.getBuyerAddressId(), buyerMember.getId())
                .orElseThrow(() -> new IllegalArgumentException("buyer address not found. id=" + request.getBuyerAddressId()));
        }

        if (!StringUtils.hasText(request.getReceiverName())) {
            throw new IllegalArgumentException("receiverName is required");
        }
        if (!StringUtils.hasText(request.getReceiverPhone())) {
            throw new IllegalArgumentException("receiverPhone is required");
        }
        if (!StringUtils.hasText(request.getBaseAddress())) {
            throw new IllegalArgumentException("baseAddress is required");
        }

        HealthBoxBuyerAddressVo address = new HealthBoxBuyerAddressVo();
        address.setBuyerMemberId(buyerMember.getId());
        address.setReceiverName(request.getReceiverName().trim());
        address.setReceiverPhone(normalizePhone(request.getReceiverPhone()));
        address.setZipCode(request.getZipCode());
        address.setBaseAddress(request.getBaseAddress().trim());
        address.setDetailAddress(request.getDetailAddress());
        address.setDefaultYn("N");
        return address;
    }

    private void restoreSkuStock(Long skuId, int quantity) {
        HealthBoxProductSkuVo sku = productSkuRepository.findWithLockById(skuId)
            .orElseThrow(() -> new IllegalArgumentException("sku not found. id=" + skuId));
        int stockQuantity = sku.getStockQuantity() != null ? sku.getStockQuantity() : 0;
        sku.setStockQuantity(stockQuantity + quantity);
        productSkuRepository.save(sku);
    }

    private int getRemainingOrderItemQuantity(HealthBoxOrderItemVo item) {
        int canceledQuantity = item.getCanceledQuantity() != null ? item.getCanceledQuantity() : 0;
        return Math.max((item.getQuantity() != null ? item.getQuantity() : 0) - canceledQuantity, 0);
    }

    private void recalculateOrderAfterCancellation(HealthBoxOrderVo order) {
        List<HealthBoxOrderItemVo> items = orderItemRepository.findByOrderIdOrderByIdAsc(order.getId());
        int remainingProductAmount = items.stream()
            .mapToInt(item -> getRemainingOrderItemQuantity(item) * (item.getPriceSnapshot() != null ? item.getPriceSnapshot() : 0))
            .sum();

        int originalProductAmount = items.stream()
            .mapToInt(item -> (item.getQuantity() != null ? item.getQuantity() : 0) * (item.getPriceSnapshot() != null ? item.getPriceSnapshot() : 0))
            .sum();

        boolean allCanceled = items.stream().allMatch(item -> getRemainingOrderItemQuantity(item) == 0);
        boolean anyCanceled = items.stream().anyMatch(item -> (item.getCanceledQuantity() != null ? item.getCanceledQuantity() : 0) > 0);
        int shippingFee = order.getShippingFee() != null ? Math.max(order.getShippingFee(), 0) : 0;
        int discountAmount = order.getDiscountAmount() != null ? Math.max(order.getDiscountAmount(), 0) : 0;
        int originalTotalAmount = Math.max(originalProductAmount + shippingFee - discountAmount, 0);
        int totalRemainingAmount = allCanceled
            ? 0
            : Math.max(remainingProductAmount + shippingFee - discountAmount, 0);

        order.setProductAmount(originalProductAmount);
        order.setShippingFee(shippingFee);
        order.setDiscountAmount(discountAmount);
        order.setTotalPaymentAmount(originalTotalAmount);
        order.setRemainingPaymentAmount(totalRemainingAmount);
        order.setCanceledPaymentAmount(Math.max(originalTotalAmount - totalRemainingAmount, 0));

        if (allCanceled) {
            order.setOrderStatus("CANCELED");
            order.setPaymentStatus("CANCELED");
        } else if (anyCanceled) {
            order.setOrderStatus("PARTIALLY_CANCELED");
            order.setPaymentStatus("PARTIALLY_CANCELED");
        }
        orderRepository.save(order);
        updatePaymentAfterCancellation(order);
    }

    private HealthBoxShipmentVo updateShipmentAfterCancellation(Long orderId, String orderStatus) {
        HealthBoxShipmentVo shipment = shipmentRepository.findByOrderId(orderId).orElse(null);
        if (shipment == null) {
            return null;
        }

        if ("CANCELED".equalsIgnoreCase(orderStatus)) {
            shipment.setShipmentStatus("CANCELED");
        } else if ("PARTIALLY_CANCELED".equalsIgnoreCase(orderStatus)) {
            shipment.setShipmentStatus("PARTIALLY_CANCELED");
        }
        return shipmentRepository.save(shipment);
    }

    private HealthBoxBuyerMemberVo validateBuyerAccess(Long buyerMemberId, Long dealerMallId, String sessionToken) {
        if (!StringUtils.hasText(sessionToken)) {
            throw new IllegalArgumentException("sessionToken is required");
        }

        HealthBoxBuyerMemberVo buyerMember = buyerMemberRepository.findById(buyerMemberId)
            .filter(member -> dealerMallId.equals(member.getDealerMallId()))
            .orElseThrow(() -> new IllegalArgumentException("buyer member does not belong to dealer mall"));
        if (!"ACTIVE".equalsIgnoreCase(buyerMember.getStatus())) {
            throw new IllegalArgumentException("buyer member is inactive");
        }
        if (buyerMember.getAccountId() == null) {
            throw new IllegalArgumentException("buyer member account is not linked");
        }

        HealthBoxAccountVo account = accountRepository.findById(buyerMember.getAccountId())
            .orElseThrow(() -> new IllegalArgumentException("buyer account not found"));
        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new IllegalArgumentException("buyer account is inactive");
        }
        if (!sessionToken.trim().equals(account.getSessionToken())) {
            throw new IllegalArgumentException("invalid buyer session");
        }
        if (account.getSessionExpiredAt() == null || account.getSessionExpiredAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("buyer session is expired");
        }

        return buyerMember;
    }

    private HealthBoxProductVo validateInquiryProduct(Long productId) {
        if (productId == null) {
            throw new IllegalArgumentException("productId is required");
        }
        HealthBoxProductVo product = productRepository.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("product not found. id=" + productId));
        if ("Y".equalsIgnoreCase(product.getDeletedYn())) {
            throw new IllegalArgumentException("product is deleted. id=" + productId);
        }
        return product;
    }

    private HealthBoxProductInquiryResponse buildProductInquiryResponse(
        HealthBoxProductInquiryVo inquiry,
        HealthBoxBuyerMemberVo viewer,
        boolean adminView
    ) {
        boolean ownerView = viewer != null
            && viewer.getId().equals(inquiry.getBuyerMemberId())
            && viewer.getDealerMallId().equals(inquiry.getDealerMallId());
        boolean canViewPrivateContent = adminView || ownerView || !"Y".equalsIgnoreCase(inquiry.getPrivateYn());
        HealthBoxBuyerMemberVo author = buyerMemberRepository.findById(inquiry.getBuyerMemberId()).orElse(null);

        HealthBoxProductInquiryResponse response = new HealthBoxProductInquiryResponse();
        response.setId(inquiry.getId());
        response.setProductId(inquiry.getProductId());
        if (adminView || ownerView) {
            response.setBuyerMemberId(inquiry.getBuyerMemberId());
            response.setDealerMallId(inquiry.getDealerMallId());
        }
        response.setQuestion(canViewPrivateContent ? inquiry.getQuestion() : "비공개 문의입니다.");
        response.setAnswer(canViewPrivateContent ? inquiry.getAnswer() : null);
        response.setAuthorName(
            canViewPrivateContent && author != null ? maskMemberName(author.getName()) : "비공개"
        );
        response.setPrivateYn("Y".equalsIgnoreCase(inquiry.getPrivateYn()) ? "Y" : "N");
        response.setIsPrivate("Y".equalsIgnoreCase(inquiry.getPrivateYn()));
        response.setStatus(inquiry.getStatus());
        response.setCreatedAt(inquiry.getCreatedAt());
        response.setAnsweredAt(inquiry.getAnsweredAt());
        return response;
    }

    private String maskMemberName(String name) {
        String normalizedName = name != null ? name.trim() : "";
        if (normalizedName.length() <= 1) {
            return normalizedName.length() == 1 ? normalizedName + "*" : "회원";
        }
        if (normalizedName.length() == 2) {
            return normalizedName.substring(0, 1) + "*";
        }
        return normalizedName.substring(0, 1)
            + "*"
            + normalizedName.substring(normalizedName.length() - 1);
    }

    private String resolveThumbnailUrl(List<HealthBoxProductMediaResponse> mediaItems) {
        if (mediaItems == null || mediaItems.isEmpty()) {
            return null;
        }

        for (HealthBoxProductMediaResponse mediaItem : mediaItems) {
            if ("THUMBNAIL".equalsIgnoreCase(mediaItem.getMediaType())) {
                return mediaItem.getMediaUrl();
            }
        }

        return mediaItems.get(0).getMediaUrl();
    }

    private void applySalesPolicy(HealthBoxProductVo target, Long salesPolicyId, String salesPolicyText) {
        if (salesPolicyId != null) {
            HealthBoxSalesPolicyVo policy = salesPolicyRepository.findById(salesPolicyId)
                .orElseThrow(() -> new IllegalArgumentException("sales policy not found. id=" + salesPolicyId));
            target.setSalesPolicyId(policy.getId());
            target.setSalesPolicyText(policy.getContent());
            return;
        }

        target.setSalesPolicyId(null);
        target.setSalesPolicyText(salesPolicyText);
    }

    private void applyDeliveryPolicy(HealthBoxProductVo target, Long deliveryPolicyId, String deliveryPolicyText) {
        if (deliveryPolicyId != null) {
            HealthBoxDeliveryPolicyVo policy = deliveryPolicyRepository.findById(deliveryPolicyId)
                .orElseThrow(() -> new IllegalArgumentException("delivery policy not found. id=" + deliveryPolicyId));
            target.setDeliveryPolicyId(policy.getId());
            target.setDeliveryPolicyText(policy.getContent());
            return;
        }

        target.setDeliveryPolicyId(null);
        target.setDeliveryPolicyText(deliveryPolicyText);
    }

    private HealthBoxCategoryVo resolveActiveCategory(Long categoryId) {
        HealthBoxCategoryVo category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new IllegalArgumentException("category not found. id=" + categoryId));
        if ("Y".equalsIgnoreCase(category.getDeletedYn())) {
            throw new IllegalArgumentException("category is deleted. id=" + categoryId);
        }
        if (!"ACTIVE".equalsIgnoreCase(category.getStatus())) {
            throw new IllegalArgumentException("category is inactive. id=" + categoryId);
        }
        return category;
    }

    private String resolveOptionUseYn(HealthBoxProductSaveRequest request) {
        if (StringUtils.hasText(request.getOptionUseYn())) {
            return request.getOptionUseYn().trim().toUpperCase(Locale.ROOT);
        }

        boolean hasOptions = request.getOptionGroups() != null && !request.getOptionGroups().isEmpty();
        boolean hasSkus = request.getSkus() != null && !request.getSkus().isEmpty();
        return (hasOptions || hasSkus) ? "Y" : "N";
    }

    private String generateProductCode(Long productId) {
        return String.format("HB-P-%06d", productId);
    }

    private String resolveProductSlug(HealthBoxProductVo target, String requestedSlug, String productName) {
        String baseSlug;
        if (StringUtils.hasText(requestedSlug)) {
            baseSlug = normalizeSimpleSlug(requestedSlug);
        } else if (StringUtils.hasText(target.getSlug())) {
            return target.getSlug();
        } else {
            baseSlug = normalizeSimpleSlug(productName);
        }

        if (!StringUtils.hasText(baseSlug)) {
            baseSlug = "product";
        }

        String candidate = baseSlug;
        int suffix = 2;
        while (isDuplicateProductSlug(target.getId(), candidate)) {
            candidate = baseSlug + "-" + suffix;
            suffix++;
        }
        return candidate;
    }

    private boolean isDuplicateProductSlug(Long currentProductId, String slug) {
        HealthBoxProductVo existing = productRepository.findBySlug(slug).orElse(null);
        return existing != null && (currentProductId == null || !existing.getId().equals(currentProductId));
    }

    private String normalizeSimpleSlug(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9가-힣]+", "-")
            .replaceAll("^-+|-+$", "");
        return StringUtils.hasText(normalized) ? normalized : null;
    }

    private String normalizeStorefrontLink(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String normalized = value.trim();
        if ((normalized.startsWith("/") && !normalized.startsWith("//"))
            || normalized.matches("(?i)^https?://\\S+$")) {
            return normalized;
        }

        throw new IllegalArgumentException("storefront link must be an internal path or an http/https URL");
    }

    private String generateCategoryCode(Long categoryId) {
        return String.format("HB-C-%06d", categoryId);
    }

    private String normalizeCategoryCode(String categoryCode) {
        if (!StringUtils.hasText(categoryCode)) {
            return null;
        }
        return categoryCode.trim().toUpperCase(Locale.ROOT);
    }

    private String buildOptionValueCode(String requestedCode, String valueName, int groupIndex, int valueIndex, Set<String> localCodes) {
        String candidate = StringUtils.hasText(requestedCode)
            ? requestedCode.trim().toUpperCase(Locale.ROOT)
            : null;

        if (!StringUtils.hasText(candidate)) {
            String normalized = normalizeCodeFragment(valueName);
            candidate = StringUtils.hasText(normalized)
                ? normalized
                : String.format("G%02dV%02d", groupIndex + 1, valueIndex + 1);
        }

        String unique = candidate;
        int suffix = 2;
        while (localCodes.contains(unique)) {
            unique = candidate + suffix;
            suffix++;
        }
        localCodes.add(unique);
        return unique;
    }

    private String resolveSkuCode(String productCode, String requestedCode, List<String> optionValueCodes, Set<String> usedCodes) {
        String candidate = StringUtils.hasText(requestedCode)
            ? requestedCode.trim().toUpperCase(Locale.ROOT)
            : productCode + "-" + String.join("-", optionValueCodes);

        String unique = candidate;
        int suffix = 2;
        while (usedCodes.contains(unique) || productSkuRepository.findBySkuCode(unique).isPresent()) {
            unique = candidate + "-" + suffix;
            suffix++;
        }
        return unique;
    }

    private String buildSkuName(String productName, List<String> optionValueCodes, Map<String, HealthBoxProductOptionValueVo> valueByCode) {
        List<String> valueNames = optionValueCodes.stream()
            .map(valueByCode::get)
            .filter(java.util.Objects::nonNull)
            .sorted(Comparator.comparing(HealthBoxProductOptionValueVo::getOptionGroupId))
            .map(HealthBoxProductOptionValueVo::getValueName)
            .collect(Collectors.toList());

        if (valueNames.isEmpty()) {
            return productName;
        }
        return productName + " / " + String.join(" / ", valueNames);
    }

    private String normalizeCodeFragment(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "");
        if (!StringUtils.hasText(normalized)) {
            return null;
        }
        return normalized.length() > 12 ? normalized.substring(0, 12) : normalized;
    }

    private HealthBoxDealerPublicResponse toDealerPublicResponse(
        HealthBoxDealerMallVo dealerMall,
        HealthBoxDealerMallPublicConfigVo publicConfig
    ) {
        HealthBoxDealerPublicResponse response = new HealthBoxDealerPublicResponse();
        response.setDealerMallId(dealerMall.getId());
        response.setSlug(dealerMall.getSlug());
        response.setMallName(coalesce(publicConfig.getMallName(), dealerMall.getMallName()));
        response.setDisplayName(coalesce(publicConfig.getDisplayName(), dealerMall.getDisplayName()));
        response.setSupportEmail(coalesce(publicConfig.getSupportEmail(), dealerMall.getSupportEmail()));
        response.setSupportPhone(coalesce(publicConfig.getSupportPhone(), dealerMall.getSupportPhone()));
        response.setLogoUrl(publicConfig.getLogoUrl());
        response.setFaviconUrl(publicConfig.getFaviconUrl());
        response.setMainVisualUrl(publicConfig.getMainVisualUrl());
        response.setMainVisualLinkUrl(publicConfig.getMainVisualLinkUrl());
        response.setMiddleBannerUrl(publicConfig.getMiddleBannerUrl());
        response.setMiddleBannerLinkUrl(publicConfig.getMiddleBannerLinkUrl());
        response.setShareThumbnailUrl(publicConfig.getShareThumbnailUrl());
        response.setMetaTitle(publicConfig.getMetaTitle());
        response.setMetaDescription(publicConfig.getMetaDescription());
        response.setMainNavigationJson(publicConfig.getMainNavigationJson());
        response.setSearchPlaceholder(publicConfig.getSearchPlaceholder());
        response.setPolicyText(publicConfig.getPolicyText());
        response.setCustomerCenterText(publicConfig.getCustomerCenterText());
        return response;
    }

    private static class DealerPublicView {
        private final HealthBoxDealerMallVo dealerMall;
        private final HealthBoxDealerMallPublicConfigVo publicConfig;

        private DealerPublicView(HealthBoxDealerMallVo dealerMall, HealthBoxDealerMallPublicConfigVo publicConfig) {
            this.dealerMall = dealerMall;
            this.publicConfig = publicConfig;
        }

        private HealthBoxDealerMallVo getDealerMall() {
            return dealerMall;
        }

        private HealthBoxDealerMallPublicConfigVo getPublicConfig() {
            return publicConfig;
        }
    }
}

