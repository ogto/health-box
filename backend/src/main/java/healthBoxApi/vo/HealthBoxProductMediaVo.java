package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_PRODUCT_MEDIA")
@ApiModel(description = "상품 미디어 엔티티")
public class HealthBoxProductMediaVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "PRODUCT_ID", nullable = false)
    private Long productId;

    @Column(name = "MEDIA_TYPE", nullable = false, length = 30)
    private String mediaType;

    @Column(name = "MEDIA_URL", nullable = false, length = 255)
    private String mediaUrl;

    @Column(name = "SORT_ORDER")
    private Integer sortOrder;

    @Column(name = "ALT_TEXT", length = 255)
    private String altText;
}

