package healthBoxApi.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class HealthBoxDatabaseIsolationGuardTest {

    @Test
    void acceptsDedicatedHealthBoxDatabase() {
        assertDoesNotThrow(() -> HealthBoxDatabaseIsolationGuard.validate(
            "jdbc:mariadb://127.0.0.1:3306/health_box?useSSL=false",
            "health_box"
        ));
    }

    @Test
    void rejectsKnownNoTitleDatabaseBeforeSpringStarts() {
        assertThrows(IllegalStateException.class, () -> HealthBoxDatabaseIsolationGuard.validate(
            "jdbc:mariadb://127.0.0.1:3306/cloud",
            "cloud"
        ));
    }

    @Test
    void rejectsDatabaseNameMismatch() {
        assertThrows(IllegalStateException.class, () -> HealthBoxDatabaseIsolationGuard.validate(
            "jdbc:mariadb://127.0.0.1:3306/another_store",
            "health_box"
        ));
    }

    @Test
    void rejectsMissingDatabaseUrl() {
        assertThrows(IllegalStateException.class, () -> HealthBoxDatabaseIsolationGuard.validate(null, "health_box"));
    }
}
