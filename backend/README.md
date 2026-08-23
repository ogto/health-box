# HealthBox API

This is the standalone backend for 건강창고몰. It must be deployed separately from NoTitle/Monoty and bread-storage services.

Required runtime variables:

- `HEALTH_BOX_DB_URL`: MariaDB JDBC URL whose database name is dedicated to HealthBox
- `HEALTH_BOX_DB_NAME`: database name selected by the URL (defaults to `health_box`)
- `HEALTH_BOX_DB_USERNAME`
- `HEALTH_BOX_DB_PASSWORD`
- `HEALTH_BOX_TOSS_LIVE_SECRET_KEY`
- `HEALTH_BOX_TOSS_TEST_SECRET_KEY` when test payments are enabled

The application refuses to start against known shared database names such as `cloud`, `sotong`, `notitle`, or `monoty`. Schema mutation is disabled by default through `HEALTH_BOX_DB_DDL_AUTO=validate`.

Create a fresh dedicated database with `src/main/resources/sql/V1__health_box_schema.sql`. Regenerate that schema from the JPA entities with `gradlew.bat generateSchema`. Files under `src/main/resources/sql/legacy/` are retained only for historical shared-database migrations and must not be run on a fresh database.

Build and verify with `gradlew.bat clean test installDist`. The runnable distribution is written to `build/install/health-box-api`.

The frontend `HEALTH_BOX_API_BASE_URL` must point only to this service, including `/api/v5` when the proxy does not add it.
