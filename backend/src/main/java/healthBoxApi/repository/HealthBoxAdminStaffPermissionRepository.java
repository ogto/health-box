package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxAdminStaffPermissionVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthBoxAdminStaffPermissionRepository extends JpaRepository<HealthBoxAdminStaffPermissionVo, Long> {
    List<HealthBoxAdminStaffPermissionVo> findByStaffIdAndStatusOrderByIdAsc(Long staffId, String status);
    void deleteByStaffId(Long staffId);
}
