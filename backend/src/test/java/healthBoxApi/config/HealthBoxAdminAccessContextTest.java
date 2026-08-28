package healthBoxApi.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class HealthBoxAdminAccessContextTest {

    @Test
    void dealerCanOnlyAccessItsOwnMall() {
        MockHttpServletRequest request = dealerRequest(37L, "ORDER_VIEW");
        HealthBoxAdminAccessContext context = new HealthBoxAdminAccessContext(request);

        assertDoesNotThrow(() -> context.requireDealerMallAccess(37L));
        assertThrows(ResponseStatusException.class, () -> context.requireDealerMallAccess(38L));
    }

    @Test
    void dealerNeedsExplicitPermission() {
        MockHttpServletRequest request = dealerRequest(37L, "ORDER_VIEW");
        HealthBoxAdminAccessContext context = new HealthBoxAdminAccessContext(request);

        assertDoesNotThrow(() -> context.requirePermission("ORDER_VIEW"));
        assertThrows(ResponseStatusException.class, () -> context.requirePermission("PRODUCT_MANAGE"));
        assertThrows(ResponseStatusException.class, context::requireHq);
    }

    @Test
    void publicReadOnlyBypassesExplicitPublicReadChecks() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/health-box/admin/products");
        request.addHeader(HealthBoxAdminAccessContext.SYSTEM_REQUEST_HEADER, HealthBoxAdminAccessContext.PUBLIC_READ_SYSTEM_REQUEST);
        HealthBoxAdminAccessContext context = new HealthBoxAdminAccessContext(request);

        assertDoesNotThrow(() -> context.requireHqOrPublicRead("PRODUCT_VIEW"));
        assertThrows(ResponseStatusException.class, () -> context.requirePermission("MEMBER_VIEW"));
    }

    @Test
    void legacyOwnerHeaderRemainsCompatibleDuringRollingDeploy() {
        MockHttpServletRequest request = new MockHttpServletRequest("PUT", "/health-box/admin/notices");
        request.addHeader(HealthBoxAdminAuditFilter.ACTOR_HEADER, "legacy-owner");
        HealthBoxAdminAccessContext context = new HealthBoxAdminAccessContext(request);

        assertDoesNotThrow(() -> context.requirePermission("NOTICE_MANAGE"));
        assertEquals("본사몰", context.getAuditScopeLabel());
    }

    private MockHttpServletRequest dealerRequest(Long dealerMallId, String permissions) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/health-box/admin/orders");
        request.addHeader(HealthBoxAdminAccessContext.SCOPE_TYPE_HEADER, "DEALER");
        request.addHeader(HealthBoxAdminAccessContext.DEALER_MALL_ID_HEADER, String.valueOf(dealerMallId));
        request.addHeader(HealthBoxAdminAccessContext.PERMISSIONS_HEADER, permissions);
        request.addHeader(HealthBoxAdminAuditFilter.ACTOR_SCOPE_HEADER, "테스트 딜러몰 (#" + dealerMallId + ")");
        return request;
    }
}
