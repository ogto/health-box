package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxBuyerAddressVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HealthBoxBuyerAddressRepository extends JpaRepository<HealthBoxBuyerAddressVo, Long> {

    List<HealthBoxBuyerAddressVo> findByBuyerMemberIdOrderByIdDesc(Long buyerMemberId);

    Optional<HealthBoxBuyerAddressVo> findByIdAndBuyerMemberId(Long id, Long buyerMemberId);
}

