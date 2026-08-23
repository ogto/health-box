package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxProductInquiryVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthBoxProductInquiryRepository extends JpaRepository<HealthBoxProductInquiryVo, Long> {
    List<HealthBoxProductInquiryVo> findByProductIdOrderByIdDesc(Long productId);
}

