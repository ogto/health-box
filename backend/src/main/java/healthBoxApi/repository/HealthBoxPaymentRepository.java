package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxPaymentVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HealthBoxPaymentRepository extends JpaRepository<HealthBoxPaymentVo, Long> {
    Optional<HealthBoxPaymentVo> findTopByOrderIdOrderByIdDesc(Long orderId);
    Optional<HealthBoxPaymentVo> findByPaymentKey(String paymentKey);
    Optional<HealthBoxPaymentVo> findByPaymentOrderId(String paymentOrderId);
}

