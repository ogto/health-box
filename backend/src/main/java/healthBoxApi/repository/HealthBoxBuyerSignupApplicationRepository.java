package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxBuyerSignupApplicationVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HealthBoxBuyerSignupApplicationRepository extends JpaRepository<HealthBoxBuyerSignupApplicationVo, Long> {

    Optional<HealthBoxBuyerSignupApplicationVo> findTopByDealerMallIdAndPhoneAndStatusOrderByIdDesc(Long dealerMallId, String phone, String status);

    Optional<HealthBoxBuyerSignupApplicationVo> findTopByDealerMallIdAndEmailAndStatusOrderByIdDesc(Long dealerMallId, String email, String status);
}

