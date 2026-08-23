package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxOrderVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface HealthBoxOrderRepository extends JpaRepository<HealthBoxOrderVo, Long> {
    List<HealthBoxOrderVo> findByDealerMallIdOrderByIdDesc(Long dealerMallId);
    List<HealthBoxOrderVo> findByBuyerMemberIdAndDealerMallIdOrderByIdDesc(Long buyerMemberId, Long dealerMallId);
    Optional<HealthBoxOrderVo> findByIdAndBuyerMemberIdAndDealerMallId(Long id, Long buyerMemberId, Long dealerMallId);
    long countByOrderedAtBetween(LocalDateTime start, LocalDateTime end);
}

