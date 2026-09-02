package healthBoxApi.config;

import healthBoxApi.repository.HealthBoxAdminAuditLogRepository;
import healthBoxApi.vo.HealthBoxAdminAuditLogVo;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.util.StreamUtils;

import javax.servlet.http.HttpServletResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class HealthBoxAdminAuditFilterTest {

    @Test
    void recordsAdminLoginEventWithAuthenticatedActor() throws Exception {
        HealthBoxAdminAuditLogRepository repository = mock(HealthBoxAdminAuditLogRepository.class);
        HealthBoxAdminAuditFilter filter = new HealthBoxAdminAuditFilter(repository);
        MockHttpServletRequest request = new MockHttpServletRequest(
            "POST",
            "/health-box/admin/auth-events/login"
        );
        request.setContentType("application/json");
        request.setContent(("{\"staffId\":1,\"targetLabel\":\"관리자 페이지\",\"roleType\":\"OWNER\"}")
            .getBytes(StandardCharsets.UTF_8));
        request.addHeader(
            HealthBoxAdminAuditFilter.ACTOR_HEADER,
            URLEncoder.encode("정진용", StandardCharsets.UTF_8.name())
        );
        request.addHeader(HealthBoxAdminAuditFilter.ACTOR_STAFF_ID_HEADER, "1");
        request.addHeader(
            HealthBoxAdminAuditFilter.ACTOR_SCOPE_HEADER,
            URLEncoder.encode("본사몰", StandardCharsets.UTF_8.name())
        );
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (servletRequest, servletResponse) -> {
            StreamUtils.copyToByteArray(servletRequest.getInputStream());
            ((HttpServletResponse) servletResponse).setStatus(HttpServletResponse.SC_NO_CONTENT);
        });

        ArgumentCaptor<HealthBoxAdminAuditLogVo> captor = ArgumentCaptor.forClass(HealthBoxAdminAuditLogVo.class);
        verify(repository).save(captor.capture());
        HealthBoxAdminAuditLogVo log = captor.getValue();
        assertEquals(Long.valueOf(1), log.getActorStaffId());
        assertEquals("정진용", log.getActorName());
        assertEquals("본사몰", log.getActorScope());
        assertEquals("ADMIN_LOGIN", log.getActionCode());
        assertEquals("관리자 로그인", log.getActionLabel());
        assertEquals("관리자 페이지", log.getTargetLabel());
        assertEquals("역할: OWNER", log.getDetailText());
        assertEquals("SUCCESS", log.getResultStatus());
    }

    @Test
    void recordsBulkShipmentDispatchAsDedicatedAction() throws Exception {
        HealthBoxAdminAuditLogRepository repository = mock(HealthBoxAdminAuditLogRepository.class);
        HealthBoxAdminAuditFilter filter = new HealthBoxAdminAuditFilter(repository);
        MockHttpServletRequest request = new MockHttpServletRequest(
            "POST",
            "/health-box/admin/shipments/bulk-dispatch"
        );
        request.setContentType("application/json");
        request.setContent("{\"rows\":[]}".getBytes(StandardCharsets.UTF_8));
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (servletRequest, servletResponse) -> {
            StreamUtils.copyToByteArray(servletRequest.getInputStream());
            ((HttpServletResponse) servletResponse).setStatus(HttpServletResponse.SC_OK);
        });

        ArgumentCaptor<HealthBoxAdminAuditLogVo> captor = ArgumentCaptor.forClass(HealthBoxAdminAuditLogVo.class);
        verify(repository).save(captor.capture());
        HealthBoxAdminAuditLogVo log = captor.getValue();
        assertEquals("SHIPMENT_BULK_DISPATCH", log.getActionCode());
        assertEquals("송장 일괄 등록", log.getActionLabel());
        assertEquals("SHIPMENT", log.getTargetType());
        assertEquals("SUCCESS", log.getResultStatus());
    }
}
