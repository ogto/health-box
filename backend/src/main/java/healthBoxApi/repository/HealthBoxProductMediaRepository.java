package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxProductMediaVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthBoxProductMediaRepository extends JpaRepository<HealthBoxProductMediaVo, Long> {

    List<HealthBoxProductMediaVo> findByProductIdOrderBySortOrderAscIdAsc(Long productId);

    void deleteByProductId(Long productId);
}

