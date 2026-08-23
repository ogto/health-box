package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxShipmentVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HealthBoxShipmentRepository extends JpaRepository<HealthBoxShipmentVo, Long> {
    Optional<HealthBoxShipmentVo> findByOrderId(Long orderId);
}

