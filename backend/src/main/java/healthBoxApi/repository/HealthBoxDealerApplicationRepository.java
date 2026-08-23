package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxDealerApplicationVo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HealthBoxDealerApplicationRepository extends JpaRepository<HealthBoxDealerApplicationVo, Long> {
}

