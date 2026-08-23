package healthBoxApi.vo;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "HEALTH_BOX_NOTICE")
@ApiModel(description = "본사 공지 엔티티")
public class HealthBoxNoticeVo extends HealthBoxBaseVo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "TITLE", nullable = false, length = 255)
    private String title;

    @Column(name = "SLUG", nullable = false, length = 255, unique = true)
    private String slug;

    @Column(name = "NOTICE_TYPE", length = 50)
    private String noticeType;

    @Column(name = "CONTENT", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "POST_STATUS", nullable = false, length = 30)
    private String postStatus = "DRAFT";

    @Column(name = "PINNED_YN", nullable = false, length = 1)
    private String pinnedYn = "N";

    @Column(name = "POSTED_AT")
    private LocalDateTime postedAt;

    @Column(name = "AUTHOR_ACCOUNT_ID")
    private Long authorAccountId;
}

