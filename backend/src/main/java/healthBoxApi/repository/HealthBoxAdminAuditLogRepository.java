package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxAdminAuditLogVo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface HealthBoxAdminAuditLogRepository extends JpaRepository<HealthBoxAdminAuditLogVo, Long> {
    List<HealthBoxAdminAuditLogVo> findByActorScopeOrderByIdDesc(String actorScope, Pageable pageable);
}
