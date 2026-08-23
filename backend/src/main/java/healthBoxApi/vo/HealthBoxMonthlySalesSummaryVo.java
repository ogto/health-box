package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_MONTHLY_SALES_SUMMARY")
@ApiModel(description = "딜러몰 월 매출 집계 엔티티")
public class HealthBoxMonthlySalesSummaryVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "DEALER_MALL_ID", nullable = false)
    private Long dealerMallId;

    @Column(name = "BASE_YEAR_MONTH", nullable = false, length = 7)
    private String baseYearMonth;

    @Column(name = "ORDER_COUNT", nullable = false)
    private Integer orderCount = 0;

    @Column(name = "GROSS_SALES", nullable = false)
    private Integer grossSales = 0;

    @Column(name = "CLAIM_DEDUCT_AMOUNT", nullable = false)
    private Integer claimDeductAmount = 0;

    @Column(name = "NET_SALES", nullable = false)
    private Integer netSales = 0;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "PENDING";
}

