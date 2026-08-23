package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxShipmentItemVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthBoxShipmentItemRepository extends JpaRepository<HealthBoxShipmentItemVo, Long> {

    List<HealthBoxShipmentItemVo> findByShipmentIdOrderByIdAsc(Long shipmentId);
}

