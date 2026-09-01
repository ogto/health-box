package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxClaimVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HealthBoxClaimRepository extends JpaRepository<HealthBoxClaimVo, Long> {
    Optional<HealthBoxClaimVo> findTopByOrderIdAndClaimTypeOrderByIdDesc(Long orderId, String claimType);
}
