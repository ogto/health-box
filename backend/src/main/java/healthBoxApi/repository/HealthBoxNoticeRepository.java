package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxNoticeVo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthBoxNoticeRepository extends JpaRepository<HealthBoxNoticeVo, Long> {
    List<HealthBoxNoticeVo> findByDealerMallIdIsNullOrderByIdDesc();
    List<HealthBoxNoticeVo> findByDealerMallIdOrderByIdDesc(Long dealerMallId);
    List<HealthBoxNoticeVo> findByDealerMallIdIsNullAndPostStatusIgnoreCaseOrderByPinnedYnDescPostedAtDescIdDesc(String postStatus);
    List<HealthBoxNoticeVo> findByDealerMallIdAndPostStatusIgnoreCaseOrderByPinnedYnDescPostedAtDescIdDesc(Long dealerMallId, String postStatus);
}

