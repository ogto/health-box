package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxProductOptionValueVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthBoxProductOptionValueRepository extends JpaRepository<HealthBoxProductOptionValueVo, Long> {

    List<HealthBoxProductOptionValueVo> findByProductIdOrderBySortOrderAscIdAsc(Long productId);
}

