package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_SALES_POLICY")
@ApiModel(description = "건강창고 판매정책 템플릿 엔티티")
public class HealthBoxSalesPolicyVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "TITLE", nullable = false, length = 150)
    private String title;

    @Lob
    @Column(name = "CONTENT", nullable = false)
    private String content;

    @Column(name = "STATUS", nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "SORT_ORDER")
    private Integer sortOrder;

    @Column(name = "DELETED_YN", nullable = false, length = 1)
    private String deletedYn = "N";

    @Column(name = "DELETED_AT")
    private LocalDateTime deletedAt;
}

