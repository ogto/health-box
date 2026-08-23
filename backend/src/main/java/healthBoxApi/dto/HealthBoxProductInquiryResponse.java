package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class HealthBoxProductInquiryResponse {
    private Long id;
    private Long productId;
    private Long buyerMemberId;
    private Long dealerMallId;
    private String question;
    private String answer;
    private String authorName;
    private String privateYn;
    private Boolean isPrivate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime answeredAt;
}

