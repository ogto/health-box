package healthBoxApi.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class HealthBoxInternalApiKeyFilter extends OncePerRequestFilter {

    public static final String HEADER_NAME = "X-Health-Box-Internal-Key";

    private final byte[] expectedKey;

    public HealthBoxInternalApiKeyFilter(@Value("${health-box.internal-api-key}") String expectedKey) {
        HealthBoxInternalApiKeyGuard.validate(expectedKey);
        this.expectedKey = expectedKey.trim().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return false;
        }

        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }
        return path.startsWith("/health-box/files/");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String suppliedKey = request.getHeader(HEADER_NAME);
        byte[] suppliedBytes = suppliedKey != null
            ? suppliedKey.getBytes(StandardCharsets.UTF_8)
            : new byte[0];

        if (!MessageDigest.isEqual(expectedKey, suppliedBytes)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Cache-Control", "no-store");
            response.getWriter().write("{\"message\":\"Unauthorized HealthBox API request\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
