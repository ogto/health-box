package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxPublicSiteConfigVo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HealthBoxPublicSiteConfigRepository extends JpaRepository<HealthBoxPublicSiteConfigVo, Long> {
}

