package healthBoxApi.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import javax.servlet.http.HttpServletResponse;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HealthBoxDealerReadOnlyFilterTest {

    private final HealthBoxDealerReadOnlyFilter filter = new HealthBoxDealerReadOnlyFilter();

    @Test
    void blocksDealerAdminMutation() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("PUT", "/health-box/admin/notices");
        request.addHeader(HealthBoxAdminAccessContext.SCOPE_TYPE_HEADER, "DEALER");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean(false);

        filter.doFilter(request, response, (servletRequest, servletResponse) -> continued.set(true));

        assertFalse(continued.get());
        assertEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus());
        assertTrue(response.getContentAsString().contains("조회만 가능합니다"));
    }

    @Test
    void allowsDealerAdminRead() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/health-box/admin/notices");
        request.addHeader(HealthBoxAdminAccessContext.SCOPE_TYPE_HEADER, "DEALER");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean(false);

        filter.doFilter(request, response, (servletRequest, servletResponse) -> continued.set(true));

        assertTrue(continued.get());
    }

    @Test
    void allowsDealerLoginAuditEvent() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/health-box/admin/auth-events/login");
        request.addHeader(HealthBoxAdminAccessContext.SCOPE_TYPE_HEADER, "DEALER");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean(false);

        filter.doFilter(request, response, (servletRequest, servletResponse) -> continued.set(true));

        assertTrue(continued.get());
    }
}
