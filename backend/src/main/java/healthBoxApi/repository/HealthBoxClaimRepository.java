package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxClaimVo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface HealthBoxClaimRepository extends JpaRepository<HealthBoxClaimVo, Long> {
    Optional<HealthBoxClaimVo> findTopByOrderIdAndClaimTypeOrderByIdDesc(Long orderId, String claimType);
    List<HealthBoxClaimVo> findByOrderIdOrderByIdDesc(Long orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select claim from HealthBoxClaimVo claim where claim.id = :id")
    Optional<HealthBoxClaimVo> findWithLockById(@Param("id") Long id);
}
