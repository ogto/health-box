package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_CATEGORY")
@ApiModel(description = "카테고리 엔티티")
public class HealthBoxCategoryVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NAME", nullable = false, length = 100)
    private String name;

    @Column(name = "SLUG", length = 100, unique = true)
    private String slug;

    @Column(name = "CATEGORY_CODE", length = 50, unique = true)
    private String categoryCode;

    @Column(name = "SORT_ORDER")
    private Integer sortOrder;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "DELETED_YN", nullable = false, length = 1)
    private String deletedYn = "N";

    @Column(name = "DELETED_AT")
    private LocalDateTime deletedAt;
}

