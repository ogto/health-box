package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxShipmentVo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface HealthBoxShipmentRepository extends JpaRepository<HealthBoxShipmentVo, Long> {
    Optional<HealthBoxShipmentVo> findByOrderId(Long orderId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<HealthBoxShipmentVo> findByOrderIdIn(List<Long> orderIds);
}

