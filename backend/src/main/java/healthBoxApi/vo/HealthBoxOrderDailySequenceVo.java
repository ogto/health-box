package healthBoxApi.vo;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_ORDER_DAILY_SEQUENCE")
public class HealthBoxOrderDailySequenceVo {

    @Id
    @Column(name = "ORDER_DATE", nullable = false)
    private LocalDate orderDate;

    @Column(name = "LAST_SEQUENCE", nullable = false)
    private Integer lastSequence;
}
