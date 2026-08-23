package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxNoticeVo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HealthBoxNoticeRepository extends JpaRepository<HealthBoxNoticeVo, Long> {
}

