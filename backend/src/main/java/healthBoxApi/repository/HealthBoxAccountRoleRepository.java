package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxAccountRoleVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HealthBoxAccountRoleRepository extends JpaRepository<HealthBoxAccountRoleVo, Long> {
    Optional<HealthBoxAccountRoleVo> findByAccountIdAndRoleAndDealerMallId(Long accountId, String role, Long dealerMallId);
    List<HealthBoxAccountRoleVo> findByAccountId(Long accountId);
}

