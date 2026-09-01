package healthBoxApi;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Date;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HealthBoxOrderNumberServiceTest {

    @Mock private JdbcTemplate jdbcTemplate;
    @InjectMocks private HealthBoxOrderNumberService service;

    @Test
    void allocatesFourDigitSequenceForEachOrderDate() {
        Date orderDate = Date.valueOf("2026-09-01");
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(orderDate))).thenReturn(1);

        String orderNo = service.nextOrderNo(LocalDateTime.of(2026, 9, 1, 23, 59));

        assertEquals("20260901-0001", orderNo);
        verify(jdbcTemplate).update(anyString(), eq(orderDate));
    }

    @Test
    void rejectsMoreThanFourDigitsInOneDay() {
        Date orderDate = Date.valueOf("2026-09-01");
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(orderDate))).thenReturn(10000);

        IllegalStateException error = assertThrows(
            IllegalStateException.class,
            () -> service.nextOrderNo(LocalDateTime.of(2026, 9, 1, 12, 0))
        );

        assertEquals("daily order sequence exceeded 9999 for 2026-09-01", error.getMessage());
    }
}
