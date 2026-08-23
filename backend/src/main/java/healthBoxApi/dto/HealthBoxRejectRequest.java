package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxRejectRequest {
    private String rejectReason;
    private String reviewMemo;
}

