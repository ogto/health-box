package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxMonthlySettlementSummaryVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthBoxMonthlySettlementSummaryRepository extends JpaRepository<HealthBoxMonthlySettlementSummaryVo, Long> {
    List<HealthBoxMonthlySettlementSummaryVo> findByDealerMallIdOrderByBaseYearMonthDesc(Long dealerMallId);
}

