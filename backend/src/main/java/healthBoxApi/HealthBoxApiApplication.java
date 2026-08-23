package healthBoxApi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import healthBoxApi.config.HealthBoxDatabaseIsolationGuard;
import healthBoxApi.config.HealthBoxInternalApiKeyGuard;

@SpringBootApplication
@EnableJpaAuditing
public class HealthBoxApiApplication {

    public static void main(String[] args) {
        HealthBoxDatabaseIsolationGuard.validate(
            System.getenv("HEALTH_BOX_DB_URL"),
            System.getenv("HEALTH_BOX_DB_NAME")
        );
        HealthBoxInternalApiKeyGuard.validate(System.getenv("HEALTH_BOX_INTERNAL_API_KEY"));
        SpringApplication.run(HealthBoxApiApplication.class, args);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
