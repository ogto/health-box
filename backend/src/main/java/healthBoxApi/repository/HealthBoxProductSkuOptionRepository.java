package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxProductSkuOptionVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthBoxProductSkuOptionRepository extends JpaRepository<HealthBoxProductSkuOptionVo, Long> {

    List<HealthBoxProductSkuOptionVo> findBySkuIdIn(List<Long> skuIds);
}

