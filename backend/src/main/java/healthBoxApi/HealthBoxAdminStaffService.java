package healthBoxApi;

import healthBoxApi.dto.HealthBoxAdminStaffResponse;
import healthBoxApi.dto.HealthBoxAdminLoginRequest;
import healthBoxApi.config.HealthBoxAdminAccessContext;
import healthBoxApi.dto.HealthBoxAdminStaffSaveRequest;
import healthBoxApi.repository.HealthBoxAdminAuditLogRepository;
import healthBoxApi.repository.HealthBoxAdminStaffPermissionRepository;
import healthBoxApi.repository.HealthBoxAdminStaffRepository;
import healthBoxApi.repository.HealthBoxAccountRepository;
import healthBoxApi.repository.HealthBoxDealerMallRepository;
import healthBoxApi.vo.HealthBoxAdminAuditLogVo;
import healthBoxApi.vo.HealthBoxAdminStaffPermissionVo;
import healthBoxApi.vo.HealthBoxAdminStaffVo;
import healthBoxApi.vo.HealthBoxAccountVo;
import healthBoxApi.vo.HealthBoxDealerMallVo;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class HealthBoxAdminStaffService {

    public static final List<String> ALL_PERMISSION_CODES = Collections.unmodifiableList(Arrays.asList(
        "DASHBOARD_VIEW",
        "ORDER_VIEW",
        "ORDER_PROCESS",
        "PRODUCT_VIEW",
        "PRODUCT_MANAGE",
        "CATEGORY_MANAGE",
        "SALES_VIEW",
        "MEMBER_VIEW",
        "MEMBER_MANAGE",
        "DEALER_VIEW",
        "DEALER_MANAGE",
        "STOREFRONT_MANAGE",
        "NOTICE_MANAGE",
        "STAFF_MANAGE",
        "AUDIT_LOG_VIEW"
    ));

    public static final List<String> DEALER_PERMISSION_CODES = Collections.unmodifiableList(Arrays.asList(
        "DASHBOARD_VIEW",
        "ORDER_VIEW",
        "ORDER_PROCESS",
        "SALES_VIEW",
        "MEMBER_VIEW",
        "MEMBER_MANAGE",
        "STOREFRONT_MANAGE",
        "NOTICE_MANAGE",
        "STAFF_MANAGE",
        "AUDIT_LOG_VIEW"
    ));

    private static final Pattern LOGIN_ID_PATTERN = Pattern.compile("^[A-Za-z0-9._-]{4,40}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final HealthBoxAdminStaffRepository staffRepository;
    private final HealthBoxAdminStaffPermissionRepository permissionRepository;
    private final HealthBoxAdminAuditLogRepository auditLogRepository;
    private final HealthBoxAccountRepository accountRepository;
    private final HealthBoxDealerMallRepository dealerMallRepository;
    private final PasswordEncoder passwordEncoder;
    private final HealthBoxAdminAccessContext accessContext;

    public HealthBoxAdminStaffService(
        HealthBoxAdminStaffRepository staffRepository,
        HealthBoxAdminStaffPermissionRepository permissionRepository,
        HealthBoxAdminAuditLogRepository auditLogRepository,
        HealthBoxAccountRepository accountRepository,
        HealthBoxDealerMallRepository dealerMallRepository,
        PasswordEncoder passwordEncoder,
        HealthBoxAdminAccessContext accessContext
    ) {
        this.staffRepository = staffRepository;
        this.permissionRepository = permissionRepository;
        this.auditLogRepository = auditLogRepository;
        this.accountRepository = accountRepository;
        this.dealerMallRepository = dealerMallRepository;
        this.passwordEncoder = passwordEncoder;
        this.accessContext = accessContext;
    }

    @Transactional(readOnly = true)
    public List<HealthBoxAdminStaffResponse> getStaffMembers() {
        accessContext.requirePermission("STAFF_MANAGE");
        List<HealthBoxAdminStaffVo> staff = accessContext.isDealer()
            ? staffRepository.findByScopeTypeAndDealerMallIdOrderByIdDesc("DEALER", accessContext.getDealerMallId())
            : staffRepository.findAllByOrderByIdDesc();
        return staff.stream()
            .filter(member -> !isDeveloper(member))
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HealthBoxAdminAuditLogVo> getAuditLogs(Integer requestedLimit) {
        accessContext.requirePermission("AUDIT_LOG_VIEW");
        int limit = requestedLimit != null ? Math.max(1, Math.min(requestedLimit, 500)) : 200;
        List<HealthBoxAdminAuditLogVo> logs;
        if (accessContext.isDealer()) {
            logs = auditLogRepository.findByActorScopeOrderByIdDesc(
                accessContext.getAuditScopeLabel(),
                PageRequest.of(0, 500)
            );
        } else {
            logs = auditLogRepository.findAll(
                PageRequest.of(0, 500, Sort.by(Sort.Direction.DESC, "id"))
            ).getContent();
        }

        List<HealthBoxAdminStaffVo> developers = staffRepository.findByRoleTypeIgnoreCase("DEVELOPER");
        Set<Long> developerIds = developers.stream()
            .map(HealthBoxAdminStaffVo::getId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        Set<String> developerNames = developers.stream()
            .map(HealthBoxAdminStaffVo::getName)
            .filter(StringUtils::hasText)
            .map(String::trim)
            .collect(Collectors.toSet());

        return logs.stream()
            .filter(log -> !isDeveloperAuditLog(log, developerIds, developerNames))
            .limit(limit)
            .collect(Collectors.toList());
    }

    @Transactional
    public HealthBoxAdminStaffResponse saveStaff(HealthBoxAdminStaffSaveRequest request) {
        accessContext.requirePermission("STAFF_MANAGE");
        if (request == null) {
            throw new IllegalArgumentException("직원 정보가 없습니다.");
        }

        boolean creating = request.getId() == null || request.getId() <= 0;
        HealthBoxAdminStaffVo staff = creating
            ? new HealthBoxAdminStaffVo()
            : staffRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("직원을 찾을 수 없습니다."));

        if (!creating && isDeveloper(staff)) {
            throw new IllegalArgumentException("개발자 계정은 직원관리 화면에서 수정할 수 없습니다.");
        }

        if (accessContext.isDealer() && !creating) {
            accessContext.requireDealerMallAccess(staff.getDealerMallId());
            if (!"DEALER".equalsIgnoreCase(staff.getScopeType())) {
                throw new IllegalArgumentException("다른 소속 직원은 수정할 수 없습니다.");
            }
            if ("OWNER".equalsIgnoreCase(staff.getRoleType())) {
                throw new IllegalArgumentException("딜러몰 대표자 계정은 본사 관리자만 수정할 수 있습니다.");
            }
        }

        String name = requiredText(request.getName(), "직원 이름", 100);
        String loginId = requiredText(request.getLoginId(), "로그인 아이디", 40).toLowerCase(Locale.ROOT);
        if (!LOGIN_ID_PATTERN.matcher(loginId).matches()) {
            throw new IllegalArgumentException("로그인 아이디는 영문, 숫자, 점, 밑줄, 하이픈으로 4~40자 입력해주세요.");
        }

        HealthBoxAdminStaffVo duplicate = staffRepository.findByLoginId(loginId).orElse(null);
        if (duplicate != null && (staff.getId() == null || !duplicate.getId().equals(staff.getId()))) {
            throw new IllegalArgumentException("이미 사용 중인 로그인 아이디입니다.");
        }

        String phone = normalizePhone(request.getPhone());
        if (phone.length() < 10 || phone.length() > 11) {
            throw new IllegalArgumentException("휴대폰 번호를 정확히 입력해주세요.");
        }

        String email = normalizeOptional(request.getEmail(), 150, "이메일");
        if (StringUtils.hasText(email) && !EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("이메일 형식이 올바르지 않습니다.");
        }

        String scopeType = accessContext.isDealer()
            ? "DEALER"
            : normalizeEnum(request.getScopeType(), "HQ", "DEALER");
        Long dealerMallId = null;
        if ("DEALER".equals(scopeType)) {
            Long requestedDealerMallId = accessContext.isDealer()
                ? accessContext.getDealerMallId()
                : request.getDealerMallId();
            if (requestedDealerMallId == null || requestedDealerMallId <= 0) {
                throw new IllegalArgumentException("소속 딜러몰을 선택해주세요.");
            }
            dealerMallRepository.findById(requestedDealerMallId)
                .orElseThrow(() -> new IllegalArgumentException("선택한 딜러몰을 찾을 수 없습니다."));
            dealerMallId = requestedDealerMallId;
        }

        String roleType = accessContext.isDealer()
            ? "STAFF"
            : normalizeEnum(request.getRoleType(), "OWNER", "STAFF");
        String status = normalizeEnum(request.getStatus(), "ACTIVE", "INACTIVE");
        String positionName = normalizeOptional(request.getPositionName(), 80, "직책");
        String memo = normalizeOptional(request.getMemo(), 1000, "메모");

        if (creating || StringUtils.hasText(request.getPassword())) {
            String password = request.getPassword() != null ? request.getPassword().trim() : "";
            if (password.length() < 8 || password.length() > 64) {
                throw new IllegalArgumentException("비밀번호는 8~64자로 입력해주세요.");
            }
            String passwordHash = passwordEncoder.encode(password);
            staff.setPasswordHash(passwordHash);
            if (!creating && staff.getAccountId() != null) {
                HealthBoxAccountVo account = accountRepository.findById(staff.getAccountId())
                    .orElseThrow(() -> new IllegalArgumentException("연결된 회원 계정을 찾을 수 없습니다."));
                account.setPasswordHash(passwordHash);
                accountRepository.save(account);
            }
        }

        staff.setScopeType(scopeType);
        staff.setDealerMallId(dealerMallId);
        staff.setName(name);
        staff.setLoginId(loginId);
        staff.setPhone(phone);
        staff.setEmail(email);
        staff.setPositionName(positionName);
        staff.setRoleType(roleType);
        staff.setStatus(status);
        staff.setMemo(memo);
        if (staff.getJoinedAt() == null) {
            staff.setJoinedAt(LocalDateTime.now());
        }
        staff = staffRepository.save(staff);

        Set<String> permissionCodes = "OWNER".equals(roleType)
            ? new LinkedHashSet<>(permissionCodesForScope(scopeType))
            : sanitizePermissionCodes(request.getPermissionCodes(), scopeType);

        permissionRepository.deleteByStaffId(staff.getId());
        permissionRepository.flush();
        final Long staffId = staff.getId();
        List<HealthBoxAdminStaffPermissionVo> permissions = permissionCodes.stream().map(code -> {
            HealthBoxAdminStaffPermissionVo permission = new HealthBoxAdminStaffPermissionVo();
            permission.setStaffId(staffId);
            permission.setPermissionCode(code);
            permission.setStatus("ACTIVE");
            return permission;
        }).collect(Collectors.toList());
        permissionRepository.saveAll(permissions);

        return toResponse(staff);
    }

    @Transactional
    public HealthBoxAdminStaffResponse authenticate(HealthBoxAdminLoginRequest request) {
        if (request == null || !StringUtils.hasText(request.getLoginId()) || !StringUtils.hasText(request.getPassword())) {
            throw new IllegalArgumentException("아이디와 비밀번호를 입력해주세요.");
        }

        String loginId = request.getLoginId().trim().toLowerCase(Locale.ROOT);
        HealthBoxAdminStaffVo staff = findStaffForLogin(loginId)
            .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));
        if (!"ACTIVE".equalsIgnoreCase(staff.getStatus()) || !isPasswordAccepted(staff, request.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        if ("DEALER".equalsIgnoreCase(staff.getScopeType())) {
            if (staff.getDealerMallId() == null) {
                throw new IllegalArgumentException("딜러몰 소속 정보가 없습니다.");
            }
            HealthBoxDealerMallVo dealerMall = dealerMallRepository.findById(staff.getDealerMallId())
                .orElseThrow(() -> new IllegalArgumentException("소속 딜러몰을 찾을 수 없습니다."));
            if (!"ACTIVE".equalsIgnoreCase(dealerMall.getStatus())) {
                throw new IllegalArgumentException("현재 사용할 수 없는 딜러몰입니다.");
            }
        }

        staff.setLastLoginAt(LocalDateTime.now());
        return toResponse(staffRepository.save(staff));
    }

    private HealthBoxAdminStaffResponse toResponse(HealthBoxAdminStaffVo staff) {
        HealthBoxAdminStaffResponse response = new HealthBoxAdminStaffResponse();
        response.setId(staff.getId());
        response.setScopeType(staff.getScopeType());
        response.setDealerMallId(staff.getDealerMallId());
        response.setScopeName(resolveScopeName(staff));
        response.setName(staff.getName());
        response.setLoginId(staff.getLoginId());
        response.setPhone(staff.getPhone());
        response.setEmail(staff.getEmail());
        response.setPositionName(staff.getPositionName());
        response.setRoleType(staff.getRoleType());
        response.setStatus(staff.getStatus());
        response.setJoinedAt(staff.getJoinedAt());
        response.setLastLoginAt(staff.getLastLoginAt());
        response.setMemo(staff.getMemo());
        if (isOwnerEquivalent(staff.getRoleType())) {
            response.setPermissionCodes(new ArrayList<>(permissionCodesForScope(staff.getScopeType())));
        } else {
            response.setPermissionCodes(
                permissionRepository.findByStaffIdAndStatusOrderByIdAsc(staff.getId(), "ACTIVE").stream()
                    .map(HealthBoxAdminStaffPermissionVo::getPermissionCode)
                    .filter(StringUtils::hasText)
                    .filter(permissionCodesForScope(staff.getScopeType())::contains)
                    .collect(Collectors.toList())
            );
        }
        return response;
    }

    private String resolveScopeName(HealthBoxAdminStaffVo staff) {
        if (!"DEALER".equalsIgnoreCase(staff.getScopeType()) || staff.getDealerMallId() == null) {
            return "본사몰";
        }
        return dealerMallRepository.findById(staff.getDealerMallId())
            .map(HealthBoxDealerMallVo::getMallName)
            .orElse("삭제된 딜러몰");
    }

    private List<String> permissionCodesForScope(String scopeType) {
        return "DEALER".equalsIgnoreCase(scopeType) ? DEALER_PERMISSION_CODES : ALL_PERMISSION_CODES;
    }

    private Optional<HealthBoxAdminStaffVo> findStaffForLogin(String loginId) {
        Optional<HealthBoxAdminStaffVo> byLoginId = staffRepository.findByLoginId(loginId);
        if (byLoginId.isPresent()) {
            return byLoginId;
        }

        String phone = normalizePhone(loginId);
        if (phone.length() >= 10 && phone.length() <= 11) {
            Optional<HealthBoxAdminStaffVo> byPhone = staffRepository.findByPhone(phone);
            if (byPhone.isPresent()) {
                return byPhone;
            }
        }

        if (EMAIL_PATTERN.matcher(loginId).matches()) {
            return staffRepository.findByEmailIgnoreCase(loginId);
        }
        return Optional.empty();
    }

    private boolean isPasswordAccepted(HealthBoxAdminStaffVo staff, String rawPassword) {
        if (staff.getAccountId() != null) {
            HealthBoxAccountVo account = accountRepository.findById(staff.getAccountId()).orElse(null);
            return account != null
                && "ACTIVE".equalsIgnoreCase(account.getStatus())
                && StringUtils.hasText(account.getPasswordHash())
                && passwordEncoder.matches(rawPassword, account.getPasswordHash());
        }
        return StringUtils.hasText(staff.getPasswordHash())
            && passwordEncoder.matches(rawPassword, staff.getPasswordHash());
    }

    private boolean isDeveloper(HealthBoxAdminStaffVo staff) {
        return staff != null && "DEVELOPER".equalsIgnoreCase(staff.getRoleType());
    }

    private boolean isDeveloperAuditLog(
        HealthBoxAdminAuditLogVo log,
        Set<Long> developerIds,
        Set<String> developerNames
    ) {
        if (log == null) {
            return false;
        }
        if (log.getActorStaffId() != null && developerIds.contains(log.getActorStaffId())) {
            return true;
        }
        if (StringUtils.hasText(log.getActorName()) && developerNames.contains(log.getActorName().trim())) {
            return true;
        }
        if (!"STAFF".equalsIgnoreCase(log.getTargetType())) {
            return false;
        }
        if (StringUtils.hasText(log.getTargetLabel()) && developerNames.contains(log.getTargetLabel().trim())) {
            return true;
        }
        if (!StringUtils.hasText(log.getTargetId())) {
            return false;
        }
        try {
            return developerIds.contains(Long.valueOf(log.getTargetId().trim()));
        } catch (NumberFormatException ignored) {
            return false;
        }
    }

    private boolean isOwnerEquivalent(String roleType) {
        return "OWNER".equalsIgnoreCase(roleType) || "DEVELOPER".equalsIgnoreCase(roleType);
    }

    private Set<String> sanitizePermissionCodes(List<String> requestedCodes, String scopeType) {
        if (requestedCodes == null || requestedCodes.isEmpty()) {
            return Collections.emptySet();
        }
        Set<String> allowed = new HashSet<>(permissionCodesForScope(scopeType));
        return requestedCodes.stream()
            .filter(StringUtils::hasText)
            .map(code -> code.trim().toUpperCase(Locale.ROOT))
            .filter(allowed::contains)
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String requiredText(String value, String label, int maxLength) {
        String normalized = value != null ? value.trim() : "";
        if (!StringUtils.hasText(normalized) || normalized.length() > maxLength) {
            throw new IllegalArgumentException(label + "은(는) 1~" + maxLength + "자로 입력해주세요.");
        }
        return normalized;
    }

    private String normalizeOptional(String value, int maxLength, String label) {
        String normalized = value != null ? value.trim() : "";
        if (normalized.length() > maxLength) {
            throw new IllegalArgumentException(label + "은(는) " + maxLength + "자 이하로 입력해주세요.");
        }
        return StringUtils.hasText(normalized) ? normalized : null;
    }

    private String normalizePhone(String value) {
        return value != null ? value.replaceAll("[^0-9]", "") : "";
    }

    private String normalizeEnum(String value, String... allowedValues) {
        String normalized = value != null ? value.trim().toUpperCase(Locale.ROOT) : "";
        for (String allowed : allowedValues) {
            if (allowed.equals(normalized)) {
                return allowed;
            }
        }
        throw new IllegalArgumentException("허용되지 않은 값입니다: " + normalized);
    }
}
