package healthBoxApi.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class HealthBoxPaymentService {

    private static final String TOSS_API_BASE_URL = "https://api.tosspayments.com";
    private static final int CONNECT_TIMEOUT_MILLIS = 5_000;
    private static final int READ_TIMEOUT_MILLIS = 10_000;

    private final ObjectMapper objectMapper;
    private final String liveSecretKey;
    private final String testSecretKey;
    private final String credentialSource;
    private final String temporaryBridgeExpiresAt;

    public HealthBoxPaymentService(
        ObjectMapper objectMapper,
        @Value("${health-box.toss.live-secret-key:}") String liveSecretKey,
        @Value("${health-box.toss.test-secret-key:}") String testSecretKey,
        @Value("${health-box.toss.credential-source:health-box}") String credentialSource,
        @Value("${health-box.toss.temporary-bridge-expires-at:}") String temporaryBridgeExpiresAt
    ) {
        this.objectMapper = objectMapper;
        this.liveSecretKey = liveSecretKey;
        this.testSecretKey = testSecretKey;
        this.credentialSource = credentialSource;
        this.temporaryBridgeExpiresAt = temporaryBridgeExpiresAt;
    }

    public HealthBoxPaymentResponse getLivePayment(String paymentKey) throws Exception {
        return getPayment(paymentKey, requireSecretKey(liveSecretKey, "live"));
    }

    public HealthBoxPaymentResponse getTestPayment(String paymentKey) throws Exception {
        return getPayment(paymentKey, requireSecretKey(testSecretKey, "test"));
    }

    public HealthBoxPaymentResponse cancelLivePayment(
        String paymentKey,
        String cancelReason,
        Integer cancelAmount,
        String idempotencyKey
    ) throws Exception {
        String normalizedPaymentKey = requirePaymentKey(paymentKey);
        if (!StringUtils.hasText(cancelReason)) {
            throw new IllegalArgumentException("cancelReason is required");
        }
        if (!StringUtils.hasText(idempotencyKey)) {
            throw new IllegalArgumentException("idempotencyKey is required");
        }

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("cancelReason", cancelReason.trim());
        if (cancelAmount != null && cancelAmount > 0) {
            requestBody.put("cancelAmount", cancelAmount);
        }

        return request(
            "POST",
            "/v1/payments/" + normalizedPaymentKey + "/cancel",
            requireSecretKey(liveSecretKey, "live"),
            objectMapper.writeValueAsBytes(requestBody),
            idempotencyKey.trim()
        );
    }

    private HealthBoxPaymentResponse getPayment(String paymentKey, String secretKey) throws Exception {
        return request("GET", "/v1/payments/" + requirePaymentKey(paymentKey), secretKey, null, null);
    }

    private HealthBoxPaymentResponse request(
        String method,
        String path,
        String secretKey,
        byte[] requestBody,
        String idempotencyKey
    ) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(TOSS_API_BASE_URL + path).openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(CONNECT_TIMEOUT_MILLIS);
        connection.setReadTimeout(READ_TIMEOUT_MILLIS);
        connection.setRequestProperty("Authorization", basicAuthorization(secretKey));
        connection.setRequestProperty("Content-Type", "application/json");
        if (StringUtils.hasText(idempotencyKey)) {
            connection.setRequestProperty("Idempotency-Key", idempotencyKey);
        }

        if (requestBody != null) {
            connection.setDoOutput(true);
            try (OutputStream outputStream = connection.getOutputStream()) {
                outputStream.write(requestBody);
            }
        }

        int responseCode = connection.getResponseCode();
        InputStream responseStream = responseCode >= 200 && responseCode < 300
            ? connection.getInputStream()
            : connection.getErrorStream();
        String responseBody = readResponse(responseStream);

        if (responseCode < 200 || responseCode >= 300) {
            throw new IllegalStateException("HealthBox Toss request failed: " + responseCode + " " + responseBody);
        }
        return objectMapper.readValue(responseBody, HealthBoxPaymentResponse.class);
    }

    private String requireSecretKey(String configuredKey, String mode) {
        validateCredentialSource();
        String key = configuredKey == null ? "" : configuredKey.trim();
        boolean valid = "live".equals(mode)
            ? key.startsWith("live_sk_") || key.startsWith("live_gsk_")
            : key.startsWith("test_sk_") || key.startsWith("test_gsk_");
        if (!valid) {
            throw new IllegalStateException("HealthBox Toss " + mode + " secret key is not configured");
        }
        return key;
    }

    private void validateCredentialSource() {
        String source = credentialSource == null ? "health-box" : credentialSource.trim().toLowerCase();
        if ("health-box".equals(source)) {
            return;
        }
        if (!"notitle-temporary".equals(source)) {
            throw new IllegalStateException("invalid HealthBox Toss credential source");
        }

        String expiresAt = temporaryBridgeExpiresAt == null ? "" : temporaryBridgeExpiresAt.trim();
        try {
            LocalDate expirationDate = LocalDate.parse(expiresAt);
            LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
            if (today.isAfter(expirationDate)) {
                throw new IllegalStateException("temporary NoTitle Toss credential bridge has expired");
            }
        } catch (DateTimeParseException error) {
            throw new IllegalStateException("temporary Toss bridge expiration must be YYYY-MM-DD", error);
        }
    }

    private String requirePaymentKey(String paymentKey) {
        String normalized = paymentKey == null ? "" : paymentKey.trim();
        if (!normalized.matches("[A-Za-z0-9_-]{6,200}")) {
            throw new IllegalArgumentException("invalid HealthBox Toss paymentKey");
        }
        return normalized;
    }

    private String basicAuthorization(String secretKey) {
        return "Basic " + Base64.getEncoder().encodeToString(
            (secretKey + ":").getBytes(StandardCharsets.UTF_8)
        );
    }

    private String readResponse(InputStream responseStream) throws Exception {
        if (responseStream == null) {
            return "";
        }
        try (BufferedReader reader = new BufferedReader(
            new InputStreamReader(responseStream, StandardCharsets.UTF_8)
        )) {
            return reader.lines().collect(Collectors.joining("\n"));
        }
    }
}
