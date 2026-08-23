package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxProductOptionGroupVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthBoxProductOptionGroupRepository extends JpaRepository<HealthBoxProductOptionGroupVo, Long> {

    List<HealthBoxProductOptionGroupVo> findByProductIdOrderBySortOrderAscIdAsc(Long productId);

    void deleteByProductId(Long productId);
}

