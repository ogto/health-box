package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxAdminStaffVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HealthBoxAdminStaffRepository extends JpaRepository<HealthBoxAdminStaffVo, Long> {
    List<HealthBoxAdminStaffVo> findAllByOrderByIdDesc();
    List<HealthBoxAdminStaffVo> findByScopeTypeAndDealerMallIdOrderByIdDesc(String scopeType, Long dealerMallId);
    List<HealthBoxAdminStaffVo> findByRoleTypeIgnoreCase(String roleType);
    Optional<HealthBoxAdminStaffVo> findByLoginId(String loginId);
    Optional<HealthBoxAdminStaffVo> findByPhone(String phone);
    Optional<HealthBoxAdminStaffVo> findByEmailIgnoreCase(String email);
}
