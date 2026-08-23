package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxAccountVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HealthBoxAccountRepository extends JpaRepository<HealthBoxAccountVo, Long> {
    Optional<HealthBoxAccountVo> findByPhone(String phone);
    Optional<HealthBoxAccountVo> findByEmail(String email);
    Optional<HealthBoxAccountVo> findBySessionToken(String sessionToken);
}

