package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxBuyerCartItemVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HealthBoxBuyerCartItemRepository extends JpaRepository<HealthBoxBuyerCartItemVo, Long> {

    List<HealthBoxBuyerCartItemVo> findByBuyerMemberIdAndDealerMallIdOrderByIdAsc(Long buyerMemberId, Long dealerMallId);

    Optional<HealthBoxBuyerCartItemVo> findByBuyerMemberIdAndDealerMallIdAndSkuId(Long buyerMemberId, Long dealerMallId, Long skuId);

    void deleteByBuyerMemberIdAndDealerMallId(Long buyerMemberId, Long dealerMallId);

    void deleteByBuyerMemberIdAndDealerMallIdAndSkuId(Long buyerMemberId, Long dealerMallId, Long skuId);
}

