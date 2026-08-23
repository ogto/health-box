package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxOrderItemVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthBoxOrderItemRepository extends JpaRepository<HealthBoxOrderItemVo, Long> {

    List<HealthBoxOrderItemVo> findByOrderIdOrderByIdAsc(Long orderId);
}

