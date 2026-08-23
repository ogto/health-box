package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxDeliveryPolicyVo;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthBoxDeliveryPolicyRepository extends JpaRepository<HealthBoxDeliveryPolicyVo, Long> {

    List<HealthBoxDeliveryPolicyVo> findByDeletedYnNotOrDeletedYnIsNull(String deletedYn, Sort sort);
}

