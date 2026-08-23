package healthBoxApi.repository;

import healthBoxApi.vo.HealthBoxCategoryVo;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HealthBoxCategoryRepository extends JpaRepository<HealthBoxCategoryVo, Long> {
    Optional<HealthBoxCategoryVo> findByNameIgnoreCaseOrSlugIgnoreCase(String name, String slug);
    Optional<HealthBoxCategoryVo> findBySlug(String slug);
    Optional<HealthBoxCategoryVo> findByCategoryCode(String categoryCode);
    List<HealthBoxCategoryVo> findByDeletedYnNotOrDeletedYnIsNull(String deletedYn, Sort sort);
}

