package healthBoxApi.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class HealthBoxInternalApiKeyGuardTest {

    @Test
    void acceptsLongDedicatedKey() {
        assertDoesNotThrow(() -> HealthBoxInternalApiKeyGuard.validate(
            "health-box-dedicated-internal-key-1234567890"
        ));
    }

    @Test
    void rejectsMissingOrShortKey() {
        assertThrows(IllegalStateException.class, () -> HealthBoxInternalApiKeyGuard.validate(null));
        assertThrows(IllegalStateException.class, () -> HealthBoxInternalApiKeyGuard.validate("too-short"));
    }
}
