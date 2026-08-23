package healthBoxApi.vo;

import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.MappedSuperclass;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import java.time.LocalDateTime;

@Getter
@Setter
@MappedSuperclass
public abstract class HealthBoxBaseVo {

    @Column(name = "CREATED_AT", nullable = false)
    @ApiModelProperty(value = "생성일시")
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT", nullable = false)
    @ApiModelProperty(value = "수정일시")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersistHealthBoxBaseVo() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdateHealthBoxBaseVo() {
        updatedAt = LocalDateTime.now();
    }
}

