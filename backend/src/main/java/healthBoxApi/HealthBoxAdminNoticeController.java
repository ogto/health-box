package healthBoxApi;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import healthBoxApi.dto.HealthBoxNoticeSaveRequest;
import healthBoxApi.vo.HealthBoxNoticeVo;
import healthBoxApi.config.HealthBoxAdminAccessContext;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Api(tags = "건강창고 관리자 API > 공지")
@RequestMapping("/health-box/admin")
public class HealthBoxAdminNoticeController {

    private final HealthBoxService service;
    private final HealthBoxAdminAccessContext accessContext;

    public HealthBoxAdminNoticeController(HealthBoxService service, HealthBoxAdminAccessContext accessContext) {
        this.service = service;
        this.accessContext = accessContext;
    }

    @ApiOperation(value = "본사 공지 저장", notes = "본사 공지를 등록/수정한다.")
    @PutMapping("/notices")
    public HealthBoxNoticeVo saveNotice(@RequestBody HealthBoxNoticeSaveRequest request) {
        accessContext.requirePermission("NOTICE_MANAGE");
        return service.saveNotice(request, accessContext.isDealer() ? accessContext.getDealerMallId() : null);
    }

    @ApiOperation(value = "본사 공지 목록 조회", notes = "본사 공지 목록을 조회한다.")
    @GetMapping("/notices")
    public List<HealthBoxNoticeVo> getNotices() {
        accessContext.requirePermission("NOTICE_MANAGE");
        return service.getNotices(accessContext.isDealer() ? accessContext.getDealerMallId() : null);
    }

    @ApiOperation(value = "본사 공지 상세 조회", notes = "본사 공지 상세를 조회한다.")
    @GetMapping("/notices/{noticeId}")
    public HealthBoxNoticeVo getNotice(@PathVariable Long noticeId) {
        accessContext.requirePermission("NOTICE_MANAGE");
        return service.getNotice(noticeId, accessContext.isDealer() ? accessContext.getDealerMallId() : null, false);
    }

    @ApiOperation(value = "본사 공지 삭제", notes = "본사 공지를 삭제한다.")
    @DeleteMapping("/notices/{noticeId}")
    public void deleteNotice(@PathVariable Long noticeId) {
        accessContext.requirePermission("NOTICE_MANAGE");
        service.deleteNotice(noticeId, accessContext.isDealer() ? accessContext.getDealerMallId() : null);
    }
}

