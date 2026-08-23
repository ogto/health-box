package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxPaymentCancelRequestVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HealthBoxPaymentCancelRequestRepository extends JpaRepository<HealthBoxPaymentCancelRequestVo, Long> {
    Optional<HealthBoxPaymentCancelRequestVo> findByRequestId(String requestId);
}

