package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_MONTHLY_SETTLEMENT_SUMMARY")
@ApiModel(description = "딜러몰 월 정산 집계 엔티티")
public class HealthBoxMonthlySettlementSummaryVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "DEALER_MALL_ID", nullable = false)
    private Long dealerMallId;

    @Column(name = "BASE_YEAR_MONTH", nullable = false, length = 7)
    private String baseYearMonth;

    @Column(name = "SETTLEMENT_BASE_SALES", nullable = false)
    private Integer settlementBaseSales = 0;

    @Column(name = "DEDUCT_AMOUNT", nullable = false)
    private Integer deductAmount = 0;

    @Column(name = "EXPECTED_SETTLEMENT_AMOUNT", nullable = false)
    private Integer expectedSettlementAmount = 0;

    @Column(name = "CONFIRMED_SETTLEMENT_AMOUNT")
    private Integer confirmedSettlementAmount;

    @Column(name = "SETTLEMENT_STATUS", nullable = false, length = 30)
    private String settlementStatus = "PENDING";

    @Column(name = "CONFIRMED_AT")
    private LocalDateTime confirmedAt;
}

