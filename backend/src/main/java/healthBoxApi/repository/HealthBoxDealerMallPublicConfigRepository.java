package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxDealerMallPublicConfigVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HealthBoxDealerMallPublicConfigRepository extends JpaRepository<HealthBoxDealerMallPublicConfigVo, Long> {
    Optional<HealthBoxDealerMallPublicConfigVo> findBySlug(String slug);
    Optional<HealthBoxDealerMallPublicConfigVo> findByDealerMallId(Long dealerMallId);
}

