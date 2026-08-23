package healthBoxApi.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HealthBoxInternalApiKeyFilterTest {

    private static final String KEY = "health-box-dedicated-internal-key-1234567890";

    @Test
    void rejectsProtectedApiWithoutKey() throws Exception {
        HealthBoxInternalApiKeyFilter filter = new HealthBoxInternalApiKeyFilter(KEY);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v5/health-box/admin/products");
        request.setContextPath("/api/v5");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(401, response.getStatus());
    }

    @Test
    void acceptsProtectedApiWithMatchingKey() throws Exception {
        HealthBoxInternalApiKeyFilter filter = new HealthBoxInternalApiKeyFilter(KEY);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v5/health-box/admin/products");
        request.setContextPath("/api/v5");
        request.addHeader(HealthBoxInternalApiKeyFilter.HEADER_NAME, KEY);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(200, response.getStatus());
    }

    @Test
    void allowsPublicFileDownloadsWithoutKey() throws Exception {
        HealthBoxInternalApiKeyFilter filter = new HealthBoxInternalApiKeyFilter(KEY);
        MockHttpServletRequest request = new MockHttpServletRequest(
            "GET",
            "/api/v5/health-box/files/00000000-0000-0000-0000-000000000000.png"
        );
        request.setContextPath("/api/v5");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(200, response.getStatus());
    }
}
