package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxDealerApplicationVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthBoxDealerApplicationRepository extends JpaRepository<HealthBoxDealerApplicationVo, Long> {
    List<HealthBoxDealerApplicationVo> findByStatusIgnoreCaseOrderByIdDesc(String status);
}

