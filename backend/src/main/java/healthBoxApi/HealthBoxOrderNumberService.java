package healthBoxApi;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class HealthBoxOrderNumberService {

    private static final int MAX_DAILY_SEQUENCE = 9999;
    private static final String INCREMENT_SEQUENCE_SQL =
        "INSERT INTO HEALTH_BOX_ORDER_DAILY_SEQUENCE (ORDER_DATE, LAST_SEQUENCE) VALUES (?, 1) "
            + "ON DUPLICATE KEY UPDATE LAST_SEQUENCE = LAST_SEQUENCE + 1";
    private static final String SELECT_SEQUENCE_SQL =
        "SELECT LAST_SEQUENCE FROM HEALTH_BOX_ORDER_DAILY_SEQUENCE WHERE ORDER_DATE = ?";

    private final JdbcTemplate jdbcTemplate;

    public HealthBoxOrderNumberService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public String nextOrderNo(LocalDateTime orderedAt) {
        LocalDate orderDate = (orderedAt != null ? orderedAt : LocalDateTime.now()).toLocalDate();
        Date sqlDate = Date.valueOf(orderDate);

        jdbcTemplate.update(INCREMENT_SEQUENCE_SQL, sqlDate);
        Integer sequence = jdbcTemplate.queryForObject(SELECT_SEQUENCE_SQL, Integer.class, sqlDate);
        if (sequence == null || sequence <= 0) {
            throw new IllegalStateException("failed to allocate daily order sequence");
        }
        if (sequence > MAX_DAILY_SEQUENCE) {
            throw new IllegalStateException("daily order sequence exceeded 9999 for " + orderDate);
        }

        return orderDate.format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + String.format("%04d", sequence);
    }
}
