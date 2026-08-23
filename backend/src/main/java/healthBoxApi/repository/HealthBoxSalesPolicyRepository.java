package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxSalesPolicyVo;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthBoxSalesPolicyRepository extends JpaRepository<HealthBoxSalesPolicyVo, Long> {

    List<HealthBoxSalesPolicyVo> findByDeletedYnNotOrDeletedYnIsNull(String deletedYn, Sort sort);
}

