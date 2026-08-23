package healthBoxApi;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import healthBoxApi.dto.HealthBoxCategoryResponse;
import healthBoxApi.dto.HealthBoxCategorySaveRequest;
import healthBoxApi.payload.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Api(tags = "건강창고 관리자 API > 상품")
@RequestMapping("/health-box/admin")
public class HealthBoxAdminCategoryController {

    private final HealthBoxService service;

    public HealthBoxAdminCategoryController(HealthBoxService service) {
        this.service = service;
    }

    @ApiOperation(value = "카테고리 목록 조회", notes = "상품 등록에 사용할 카테고리 템플릿 목록을 조회한다.")
    @GetMapping("/categories")
    public List<HealthBoxCategoryResponse> getCategories() {
        return service.getCategories();
    }

    @ApiOperation(value = "카테고리 상세 조회", notes = "카테고리 템플릿 상세를 조회한다.")
    @GetMapping("/categories/{categoryId}")
    public HealthBoxCategoryResponse getCategory(@PathVariable Long categoryId) {
        return service.getCategory(categoryId);
    }

    @ApiOperation(value = "카테고리 저장", notes = "카테고리 템플릿을 등록/수정한다.")
    @PutMapping("/categories")
    public HealthBoxCategoryResponse saveCategory(@RequestBody HealthBoxCategorySaveRequest request) {
        return service.saveCategory(request);
    }

    @ApiOperation(value = "카테고리 소프트 삭제", notes = "카테고리 템플릿을 물리 삭제하지 않고 삭제 상태로 전환한다.")
    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<ApiResponse> deleteCategory(@PathVariable Long categoryId) {
        return new ResponseEntity<>(
            new ApiResponse(true, "deleted", service.deleteCategory(categoryId)),
            HttpStatus.OK
        );
    }
}

