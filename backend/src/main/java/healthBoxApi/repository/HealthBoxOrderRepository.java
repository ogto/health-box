package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxOrderVo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface HealthBoxOrderRepository extends JpaRepository<HealthBoxOrderVo, Long> {
    List<HealthBoxOrderVo> findByDealerMallIdOrderByIdDesc(Long dealerMallId);
    List<HealthBoxOrderVo> findByBuyerMemberIdAndDealerMallIdOrderByIdDesc(Long buyerMemberId, Long dealerMallId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<HealthBoxOrderVo> findByOrderNoIn(List<String> orderNos);
    Optional<HealthBoxOrderVo> findByIdAndBuyerMemberIdAndDealerMallId(Long id, Long buyerMemberId, Long dealerMallId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select orderHeader from HealthBoxOrderVo orderHeader where orderHeader.id = :id and orderHeader.buyerMemberId = :buyerMemberId and orderHeader.dealerMallId = :dealerMallId")
    Optional<HealthBoxOrderVo> findBuyerOrderWithLock(
        @Param("id") Long id,
        @Param("buyerMemberId") Long buyerMemberId,
        @Param("dealerMallId") Long dealerMallId
    );
    long countByOrderedAtBetween(LocalDateTime start, LocalDateTime end);
}

