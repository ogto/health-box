package healthBoxApi.config;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
@Order(Ordered.LOWEST_PRECEDENCE - 50)
public class HealthBoxDealerReadOnlyFilter extends OncePerRequestFilter {

    private static final String READ_ONLY_MESSAGE = "딜러 관리자 계정은 조회만 가능합니다.";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        String path = normalizedPath(request);
        if (!path.startsWith("/health-box/admin/")) {
            return true;
        }

        return path.startsWith("/health-box/admin/auth/")
            || path.startsWith("/health-box/admin/auth-events/")
            || !"DEALER".equalsIgnoreCase(request.getHeader(HealthBoxAdminAccessContext.SCOPE_TYPE_HEADER));
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.getWriter().write("{\"success\":false,\"message\":\"" + READ_ONLY_MESSAGE + "\"}");
    }

    private String normalizedPath(HttpServletRequest request) {
        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (StringUtils.hasText(contextPath) && path.startsWith(contextPath)) {
            return path.substring(contextPath.length());
        }
        return path;
    }
}
