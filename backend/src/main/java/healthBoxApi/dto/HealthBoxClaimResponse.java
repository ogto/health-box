package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class HealthBoxClaimResponse {
    private Long id;
    private String claimType;
    private String status;
    private Integer amount;
    private String reason;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
}
