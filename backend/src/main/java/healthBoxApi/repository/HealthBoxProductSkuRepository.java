package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxProductSkuVo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface HealthBoxProductSkuRepository extends JpaRepository<HealthBoxProductSkuVo, Long> {

    List<HealthBoxProductSkuVo> findByProductIdOrderByIdAsc(Long productId);

    void deleteByProductId(Long productId);

    Optional<HealthBoxProductSkuVo> findBySkuCode(String skuCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<HealthBoxProductSkuVo> findWithLockById(Long id);
}

