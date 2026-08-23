package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxProductVo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface HealthBoxProductRepository extends JpaRepository<HealthBoxProductVo, Long>, JpaSpecificationExecutor<HealthBoxProductVo> {
    Optional<HealthBoxProductVo> findBySlug(String slug);
    Optional<HealthBoxProductVo> findByIdAndSlug(Long id, String slug);
}

