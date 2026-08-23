package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxBuyerMemberVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HealthBoxBuyerMemberRepository extends JpaRepository<HealthBoxBuyerMemberVo, Long> {
    List<HealthBoxBuyerMemberVo> findByDealerMallIdOrderByIdDesc(Long dealerMallId);
    List<HealthBoxBuyerMemberVo> findByPhoneOrderByIdDesc(String phone);
    List<HealthBoxBuyerMemberVo> findByEmailOrderByIdDesc(String email);
    Optional<HealthBoxBuyerMemberVo> findByDealerMallIdAndPhone(Long dealerMallId, String phone);
    Optional<HealthBoxBuyerMemberVo> findByDealerMallIdAndEmail(Long dealerMallId, String email);
    Optional<HealthBoxBuyerMemberVo> findByAccountId(Long accountId);
    Optional<HealthBoxBuyerMemberVo> findByAccountIdAndDealerMallId(Long accountId, Long dealerMallId);
}

