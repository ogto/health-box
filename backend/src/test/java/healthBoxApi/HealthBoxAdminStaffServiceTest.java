package healthBoxApi;

import healthBoxApi.config.HealthBoxAdminAccessContext;
import healthBoxApi.repository.HealthBoxAccountRepository;
import healthBoxApi.repository.HealthBoxAdminAuditLogRepository;
import healthBoxApi.repository.HealthBoxAdminStaffPermissionRepository;
import healthBoxApi.repository.HealthBoxAdminStaffRepository;
import healthBoxApi.repository.HealthBoxDealerMallRepository;
import healthBoxApi.vo.HealthBoxAdminAuditLogVo;
import healthBoxApi.vo.HealthBoxAdminStaffVo;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HealthBoxAdminStaffServiceTest {

    @Test
    void hidesDeveloperActivityAndDeveloperAccountChangesFromAuditLogResults() {
        HealthBoxAdminStaffRepository staffRepository = mock(HealthBoxAdminStaffRepository.class);
        HealthBoxAdminStaffPermissionRepository permissionRepository = mock(HealthBoxAdminStaffPermissionRepository.class);
        HealthBoxAdminAuditLogRepository auditLogRepository = mock(HealthBoxAdminAuditLogRepository.class);
        HealthBoxAccountRepository accountRepository = mock(HealthBoxAccountRepository.class);
        HealthBoxDealerMallRepository dealerMallRepository = mock(HealthBoxDealerMallRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        HealthBoxAdminAccessContext accessContext = mock(HealthBoxAdminAccessContext.class);
        HealthBoxAdminStaffService service = new HealthBoxAdminStaffService(
            staffRepository,
            permissionRepository,
            auditLogRepository,
            accountRepository,
            dealerMallRepository,
            passwordEncoder,
            accessContext
        );

        HealthBoxAdminStaffVo developer = new HealthBoxAdminStaffVo();
        developer.setId(4L);
        developer.setName("신경훈");
        developer.setRoleType("DEVELOPER");
        when(staffRepository.findByRoleTypeIgnoreCase("DEVELOPER"))
            .thenReturn(Collections.singletonList(developer));

        HealthBoxAdminAuditLogVo developerLogin = auditLog(3L, 4L, "신경훈", "AUTH_SESSION", "4", "관리자 페이지");
        HealthBoxAdminAuditLogVo developerAccountSave = auditLog(2L, 1L, "정진용", "STAFF", "4", "신경훈");
        HealthBoxAdminAuditLogVo normalLogin = auditLog(1L, 1L, "정진용", "AUTH_SESSION", "1", "관리자 페이지");
        when(auditLogRepository.findAll(any(Pageable.class)))
            .thenReturn(new PageImpl<>(Arrays.asList(developerLogin, developerAccountSave, normalLogin)));

        List<HealthBoxAdminAuditLogVo> result = service.getAuditLogs(200);

        assertEquals(1, result.size());
        assertEquals(Long.valueOf(1), result.get(0).getId());
        assertEquals("정진용", result.get(0).getActorName());
    }

    private HealthBoxAdminAuditLogVo auditLog(
        Long id,
        Long actorStaffId,
        String actorName,
        String targetType,
        String targetId,
        String targetLabel
    ) {
        HealthBoxAdminAuditLogVo log = new HealthBoxAdminAuditLogVo();
        log.setId(id);
        log.setActorStaffId(actorStaffId);
        log.setActorName(actorName);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setTargetLabel(targetLabel);
        return log;
    }
}
