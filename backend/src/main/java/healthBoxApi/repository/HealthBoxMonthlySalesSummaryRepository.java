package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxMonthlySalesSummaryVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthBoxMonthlySalesSummaryRepository extends JpaRepository<HealthBoxMonthlySalesSummaryVo, Long> {
    List<HealthBoxMonthlySalesSummaryVo> findByDealerMallIdOrderByBaseYearMonthDesc(Long dealerMallId);
}

