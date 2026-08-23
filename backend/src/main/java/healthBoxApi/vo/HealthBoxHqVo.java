package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_HQ")
@ApiModel(description = "건강창고 본사 엔티티")
public class HealthBoxHqVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NAME", nullable = false, length = 100)
    @ApiModelProperty(value = "본사명")
    private String name;

    @Column(name = "BUSINESS_NO", length = 50)
    @ApiModelProperty(value = "사업자번호")
    private String businessNo;

    @Column(name = "BUSINESS_INFO", length = 500)
    @ApiModelProperty(value = "사업자정보")
    private String businessInfo;

    @Column(name = "REPRESENTATIVE_NAME", length = 100)
    @ApiModelProperty(value = "대표자명")
    private String representativeName;

    @Column(name = "CONTACT_PHONE", length = 30)
    @ApiModelProperty(value = "대표 연락처")
    private String contactPhone;

    @Column(name = "CONTACT_EMAIL", length = 150)
    @ApiModelProperty(value = "대표 이메일")
    private String contactEmail;

    @Column(name = "STATUS", nullable = false, length = 30)
    @ApiModelProperty(value = "운영상태")
    private String status = "ACTIVE";
}

