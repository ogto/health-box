package healthBoxApi.config;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.Collections;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class HealthBoxAdminAccessContext {

    public static final String SCOPE_TYPE_HEADER = "X-Health-Box-Admin-Scope-Type";
    public static final String DEALER_MALL_ID_HEADER = "X-Health-Box-Admin-Dealer-Mall-Id";
    public static final String PERMISSIONS_HEADER = "X-Health-Box-Admin-Permissions";
    public static final String SYSTEM_REQUEST_HEADER = "X-Health-Box-Admin-System-Request";
    public static final String PUBLIC_READ_SYSTEM_REQUEST = "PUBLIC_READ";

    private final HttpServletRequest request;

    public HealthBoxAdminAccessContext(HttpServletRequest request) {
        this.request = request;
    }

    public boolean isDealer() {
        return "DEALER".equalsIgnoreCase(request.getHeader(SCOPE_TYPE_HEADER));
    }

    public boolean isPublicRead() {
        return "GET".equalsIgnoreCase(request.getMethod())
            && PUBLIC_READ_SYSTEM_REQUEST.equalsIgnoreCase(request.getHeader(SYSTEM_REQUEST_HEADER));
    }

    public Long getDealerMallId() {
        if (!isDealer()) {
            return null;
        }
        try {
            Long dealerMallId = Long.valueOf(request.getHeader(DEALER_MALL_ID_HEADER));
            if (dealerMallId <= 0) {
                throw forbidden("딜러몰 범위가 올바르지 않습니다.");
            }
            return dealerMallId;
        } catch (NumberFormatException error) {
            throw forbidden("딜러몰 범위가 올바르지 않습니다.");
        }
    }

    public void requirePermission(String permissionCode) {
        if (isLegacyInternalRequest()) {
            return;
        }
        if (!permissions().contains(permissionCode)) {
            throw forbidden("이 업무를 처리할 권한이 없습니다.");
        }
    }

    public void requireAnyPermission(String... permissionCodes) {
        if (isLegacyInternalRequest()) {
            return;
        }
        Set<String> granted = permissions();
        boolean allowed = Arrays.stream(permissionCodes).anyMatch(granted::contains);
        if (!allowed) {
            throw forbidden("이 업무를 조회할 권한이 없습니다.");
        }
    }

    public void requireHq() {
        if (isDealer()) {
            throw forbidden("본사 관리자만 접근할 수 있습니다.");
        }
    }

    public void requireHqOrPublicRead(String permissionCode) {
        if (isPublicRead()) {
            return;
        }
        requireHq();
        requirePermission(permissionCode);
    }

    public void requireDealerMallAccess(Long dealerMallId) {
        if (isDealer() && (dealerMallId == null || !getDealerMallId().equals(dealerMallId))) {
            throw forbidden("다른 딜러몰의 데이터에는 접근할 수 없습니다.");
        }
    }

    public String getAuditScopeLabel() {
        String actorScope = HealthBoxAdminAuditFilter.decodeHeaderValue(
            request.getHeader(HealthBoxAdminAuditFilter.ACTOR_SCOPE_HEADER)
        );
        if (StringUtils.hasText(actorScope)) {
            return actorScope.trim();
        }
        return isDealer() ? "딜러몰 #" + getDealerMallId() : "본사몰";
    }

    private boolean isLegacyInternalRequest() {
        return "legacy-owner".equals(request.getHeader(HealthBoxAdminAuditFilter.ACTOR_HEADER))
            && !StringUtils.hasText(request.getHeader(SCOPE_TYPE_HEADER));
    }

    private Set<String> permissions() {
        String header = request.getHeader(PERMISSIONS_HEADER);
        if (!StringUtils.hasText(header)) {
            return Collections.emptySet();
        }
        return Arrays.stream(header.split(","))
            .map(String::trim)
            .filter(StringUtils::hasText)
            .map(value -> value.toUpperCase(Locale.ROOT))
            .collect(Collectors.toSet());
    }

    private ResponseStatusException forbidden(String message) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }
}
