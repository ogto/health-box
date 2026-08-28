package healthBoxApi.config;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import healthBoxApi.repository.HealthBoxAdminAuditLogRepository;
import healthBoxApi.vo.HealthBoxAdminAuditLogVo;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Order(Ordered.LOWEST_PRECEDENCE - 100)
public class HealthBoxAdminAuditFilter extends OncePerRequestFilter {

    public static final String ACTOR_HEADER = "X-Health-Box-Admin-Actor";
    public static final String ACTOR_STAFF_ID_HEADER = "X-Health-Box-Admin-Actor-Staff-Id";
    public static final String ACTOR_SCOPE_HEADER = "X-Health-Box-Admin-Actor-Scope";

    private static final Pattern NUMBER_PATTERN = Pattern.compile("/(\\d+)(?:/|$)");

    private final HealthBoxAdminAuditLogRepository auditLogRepository;

    public HealthBoxAdminAuditFilter(HealthBoxAdminAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }
        String path = normalizedPath(request);
        return !path.startsWith("/health-box/admin/")
            || path.startsWith("/health-box/admin/audit-logs")
            || path.startsWith("/health-box/admin/auth/");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        ContentCachingRequestWrapper wrappedRequest = request instanceof ContentCachingRequestWrapper
            ? (ContentCachingRequestWrapper) request
            : new ContentCachingRequestWrapper(request);

        try {
            filterChain.doFilter(wrappedRequest, response);
        } finally {
            saveAuditLogSafely(wrappedRequest, response);
        }
    }

    private void saveAuditLogSafely(ContentCachingRequestWrapper request, HttpServletResponse response) {
        try {
            String path = normalizedPath(request);
            ActionDescriptor descriptor = describeAction(request.getMethod(), path);
            JsonObject body = parseJsonBody(request);

            HealthBoxAdminAuditLogVo log = new HealthBoxAdminAuditLogVo();
            String actorToken = trimToNull(decodeHeaderValue(request.getHeader(ACTOR_HEADER)));
            log.setActorStaffId(parseLong(request.getHeader(ACTOR_STAFF_ID_HEADER)));
            log.setActorName("legacy-owner".equals(actorToken) || !StringUtils.hasText(actorToken)
                ? "대표자(공용 로그인)"
                : limited(actorToken, 120));
            String actorScope = trimToNull(decodeHeaderValue(request.getHeader(ACTOR_SCOPE_HEADER)));
            log.setActorScope(limited(
                !StringUtils.hasText(actorScope) || "hq".equalsIgnoreCase(actorScope) ? "본사몰" : actorScope,
                150
            ));
            log.setActionCode(descriptor.code);
            log.setActionLabel(descriptor.label);
            log.setTargetType(descriptor.targetType);
            log.setTargetId(limited(resolveTargetId(path, body), 100));
            log.setTargetLabel(limited(resolveTargetLabel(path, body), 255));
            log.setDetailText(limited(resolveDetail(body), 2000));
            log.setRequestMethod(request.getMethod());
            log.setRequestPath(limited(path, 500));
            log.setResultStatus(response.getStatus() >= 200 && response.getStatus() < 400
                ? "SUCCESS"
                : "FAILED_" + response.getStatus());
            auditLogRepository.save(log);
        } catch (Exception error) {
            logger.warn("Failed to save HealthBox admin audit log", error);
        }
    }

    private ActionDescriptor describeAction(String method, String path) {
        if (path.endsWith("/auth-events/login")) return action("ADMIN_LOGIN", "관리자 로그인", "AUTH_SESSION");
        if (path.endsWith("/auth-events/logout")) return action("ADMIN_LOGOUT", "관리자 로그아웃", "AUTH_SESSION");
        if (path.matches(".*/dealer-applications/\\d+/approve$")) return action("DEALER_APPROVE", "딜러 신청 승인", "DEALER_APPLICATION");
        if (path.matches(".*/dealer-applications/\\d+/reject$")) return action("DEALER_REJECT", "딜러 신청 반려", "DEALER_APPLICATION");
        if (path.matches(".*/buyer-signup-applications/\\d+/approve$")) return action("MEMBER_APPROVE", "회원 가입 승인", "MEMBER_APPLICATION");
        if (path.matches(".*/buyer-signup-applications/\\d+/reject$")) return action("MEMBER_REJECT", "회원 가입 반려", "MEMBER_APPLICATION");
        if (path.matches(".*/shipments/\\d+/status$")) return action("SHIPMENT_UPDATE", "배송 처리", "SHIPMENT");
        if (path.matches(".*/orders/\\d+/partial-cancel$")) return action("ORDER_PARTIAL_CANCEL", "주문 부분 취소", "ORDER");
        if (path.matches(".*/orders/\\d+/cancel$")) return action("ORDER_CANCEL", "주문 취소", "ORDER");
        if (path.contains("/product-inquiries/") && "PUT".equalsIgnoreCase(method)) return action("INQUIRY_ANSWER", "상품 문의 답변", "PRODUCT_INQUIRY");
        if (path.matches(".*/products/\\d+$") && "DELETE".equalsIgnoreCase(method)) return action("PRODUCT_DELETE", "상품 삭제 처리", "PRODUCT");
        if (path.endsWith("/products") && "PUT".equalsIgnoreCase(method)) return action("PRODUCT_SAVE", "상품 등록·수정", "PRODUCT");
        if (path.matches(".*/categories/\\d+$") && "DELETE".equalsIgnoreCase(method)) return action("CATEGORY_DELETE", "카테고리 삭제", "CATEGORY");
        if (path.endsWith("/categories") && "PUT".equalsIgnoreCase(method)) return action("CATEGORY_SAVE", "카테고리 등록·수정", "CATEGORY");
        if (path.matches(".*/notices/\\d+$") && "DELETE".equalsIgnoreCase(method)) return action("NOTICE_DELETE", "공지 삭제", "NOTICE");
        if (path.endsWith("/notices") && "PUT".equalsIgnoreCase(method)) return action("NOTICE_SAVE", "공지 등록·수정", "NOTICE");
        if (path.endsWith("/staff") && "PUT".equalsIgnoreCase(method)) return action("STAFF_SAVE", "직원 계정·권한 저장", "STAFF");
        if (path.contains("/public-site-config")) return action("STOREFRONT_SAVE", "홈페이지 설정 변경", "STOREFRONT");
        if (path.contains("/sales-policies")) return action("SALES_POLICY_SAVE", "판매정책 변경", "SALES_POLICY");
        if (path.contains("/delivery-policies")) return action("DELIVERY_POLICY_SAVE", "배송정책 변경", "DELIVERY_POLICY");
        if (path.endsWith("/dealer-malls/manual")) return action("DEALER_CREATE", "딜러몰 직접 추가", "DEALER_MALL");
        return action("ADMIN_MUTATION", "관리자 정보 변경", "ADMIN_RESOURCE");
    }

    private ActionDescriptor action(String code, String label, String targetType) {
        return new ActionDescriptor(code, label, targetType);
    }

    private JsonObject parseJsonBody(ContentCachingRequestWrapper request) {
        byte[] content = request.getContentAsByteArray();
        if (content.length == 0) {
            return null;
        }
        String contentType = request.getContentType();
        if (!StringUtils.hasText(contentType) || !contentType.toLowerCase().contains("application/json")) {
            return null;
        }
        JsonElement parsed = new JsonParser().parse(new String(content, StandardCharsets.UTF_8));
        return parsed.isJsonObject() ? parsed.getAsJsonObject() : null;
    }

    private String resolveTargetId(String path, JsonObject body) {
        String bodyId = firstString(body, "id", "staffId", "applicationId", "productId", "orderId", "shipmentId");
        if (StringUtils.hasText(bodyId) && !"0".equals(bodyId)) {
            return bodyId;
        }
        Matcher matcher = NUMBER_PATTERN.matcher(path);
        String last = null;
        while (matcher.find()) {
            last = matcher.group(1);
        }
        return last;
    }

    private String resolveTargetLabel(String path, JsonObject body) {
        String label = firstString(body, "targetLabel", "name", "title", "mallName", "wantedMallName", "displayName", "orderNo");
        return StringUtils.hasText(label) ? label : path;
    }

    private String resolveDetail(JsonObject body) {
        if (body == null) {
            return null;
        }
        List<String> parts = new ArrayList<>();
        addDetail(parts, "처리 상태", firstString(body, "shipmentStatus", "status", "publishStatus"));
        addDetail(parts, "택배사", firstString(body, "courierCompany"));
        addDetail(parts, "송장번호", firstString(body, "trackingNo"));
        addDetail(parts, "반려 사유", firstString(body, "rejectReason"));
        addDetail(parts, "검토 메모", firstString(body, "reviewMemo"));
        addDetail(parts, "소속", firstString(body, "scopeType"));
        addDetail(parts, "역할", firstString(body, "roleType"));
        return parts.isEmpty() ? null : String.join(" · ", parts);
    }

    private void addDetail(List<String> parts, String label, String value) {
        if (StringUtils.hasText(value)) {
            parts.add(label + ": " + value);
        }
    }

    private String firstString(JsonObject body, String... keys) {
        if (body == null) {
            return null;
        }
        for (String key : keys) {
            JsonElement value = body.get(key);
            if (value != null && !value.isJsonNull() && value.isJsonPrimitive()) {
                String text = value.getAsString();
                if (StringUtils.hasText(text)) {
                    return text.trim();
                }
            }
        }
        return null;
    }

    private String normalizedPath(HttpServletRequest request) {
        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (StringUtils.hasText(contextPath) && path.startsWith(contextPath)) {
            return path.substring(contextPath.length());
        }
        return path;
    }

    private Long parseLong(String value) {
        try {
            return StringUtils.hasText(value) ? Long.valueOf(value.trim()) : null;
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String limited(String value, int maxLength) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }

    public static String decodeHeaderValue(String value) {
        if (!StringUtils.hasText(value)) {
            return value;
        }
        try {
            return URLDecoder.decode(value, StandardCharsets.UTF_8.name());
        } catch (Exception ignored) {
            return value;
        }
    }

    private static class ActionDescriptor {
        private final String code;
        private final String label;
        private final String targetType;

        private ActionDescriptor(String code, String label, String targetType) {
            this.code = code;
            this.label = label;
            this.targetType = targetType;
        }
    }
}
