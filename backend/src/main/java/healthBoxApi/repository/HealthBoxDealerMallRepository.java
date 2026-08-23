package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxDealerMallVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HealthBoxDealerMallRepository extends JpaRepository<HealthBoxDealerMallVo, Long> {
    Optional<HealthBoxDealerMallVo> findBySlug(String slug);
    boolean existsBySlug(String slug);
}

