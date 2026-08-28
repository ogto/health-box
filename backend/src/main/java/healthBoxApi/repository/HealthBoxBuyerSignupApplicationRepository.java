package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxBuyerSignupApplicationVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface HealthBoxBuyerSignupApplicationRepository extends JpaRepository<HealthBoxBuyerSignupApplicationVo, Long> {

    List<HealthBoxBuyerSignupApplicationVo> findByDealerMallIdOrderByIdDesc(Long dealerMallId);

    Optional<HealthBoxBuyerSignupApplicationVo> findTopByDealerMallIdAndPhoneAndStatusOrderByIdDesc(Long dealerMallId, String phone, String status);

    Optional<HealthBoxBuyerSignupApplicationVo> findTopByDealerMallIdAndEmailAndStatusOrderByIdDesc(Long dealerMallId, String email, String status);
}

