package healthBoxApi;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import healthBoxApi.vo.HealthBoxPublicSiteConfigVo;
import org.springframework.web.bind.annotation.*;

@RestController
@Api(tags = "건강창고 관리자 API > 사이트설정")
@RequestMapping("/health-box/admin")
public class HealthBoxAdminSiteController {

    private final HealthBoxService service;

    public HealthBoxAdminSiteController(HealthBoxService service) {
        this.service = service;
    }

    @ApiOperation(value = "공통 홈페이지 설정 조회", notes = "공개몰 공통 설정을 조회한다.")
    @GetMapping("/public-site-config")
    public HealthBoxPublicSiteConfigVo getPublicSiteConfig() {
        return service.getPublicSiteConfig();
    }

    @ApiOperation(value = "공통 홈페이지 설정 저장", notes = "공개몰 공통 설정을 저장한다.")
    @PutMapping("/public-site-config")
    public HealthBoxPublicSiteConfigVo savePublicSiteConfig(@RequestBody HealthBoxPublicSiteConfigVo vo) {
        return service.savePublicSiteConfig(vo);
    }
}

