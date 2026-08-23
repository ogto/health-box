package healthBoxApi.config;

import org.springframework.util.StringUtils;

public final class HealthBoxInternalApiKeyGuard {

    private static final int MINIMUM_KEY_LENGTH = 32;

    private HealthBoxInternalApiKeyGuard() {
    }

    public static void validate(String key) {
        if (!StringUtils.hasText(key) || key.trim().length() < MINIMUM_KEY_LENGTH) {
            throw new IllegalStateException(
                "HEALTH_BOX_INTERNAL_API_KEY must be configured with at least 32 characters"
            );
        }
    }
}
