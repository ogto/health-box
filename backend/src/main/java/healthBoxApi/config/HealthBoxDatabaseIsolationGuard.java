package healthBoxApi.config;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public final class HealthBoxDatabaseIsolationGuard {

    private static final String DEFAULT_DATABASE_NAME = "health_box";
    private static final Set<String> FORBIDDEN_SHARED_DATABASE_NAMES = new HashSet<>(Arrays.asList(
        "cloud",
        "sotong",
        "notitle",
        "monoty",
        "bread_storage",
        "breadstorage"
    ));

    private HealthBoxDatabaseIsolationGuard() {
    }

    public static void validate(String jdbcUrl, String configuredExpectedDatabaseName) {
        String actualDatabaseName = extractDatabaseName(jdbcUrl);
        String expectedDatabaseName = normalizeDatabaseName(configuredExpectedDatabaseName);
        if (expectedDatabaseName.isEmpty()) {
            expectedDatabaseName = DEFAULT_DATABASE_NAME;
        }

        if (FORBIDDEN_SHARED_DATABASE_NAMES.contains(actualDatabaseName)) {
            throw new IllegalStateException("HealthBox must not use a shared NoTitle/Monoty database");
        }
        if (!expectedDatabaseName.equals(actualDatabaseName)) {
            throw new IllegalStateException(
                "HEALTH_BOX_DB_URL selects database '" + actualDatabaseName
                    + "' but HEALTH_BOX_DB_NAME requires '" + expectedDatabaseName + "'"
            );
        }
    }

    private static String extractDatabaseName(String jdbcUrl) {
        if (jdbcUrl == null || !jdbcUrl.trim().startsWith("jdbc:mariadb://")) {
            throw new IllegalStateException("HEALTH_BOX_DB_URL must be a MariaDB JDBC URL");
        }

        String normalizedUrl = jdbcUrl.trim();
        int queryIndex = normalizedUrl.indexOf('?');
        String withoutQuery = normalizedUrl.substring(0, queryIndex >= 0 ? queryIndex : normalizedUrl.length());
        int slashIndex = withoutQuery.lastIndexOf('/');
        if (slashIndex < 0 || slashIndex == withoutQuery.length() - 1) {
            throw new IllegalStateException("HEALTH_BOX_DB_URL must include a database name");
        }
        return normalizeDatabaseName(withoutQuery.substring(slashIndex + 1));
    }

    private static String normalizeDatabaseName(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
