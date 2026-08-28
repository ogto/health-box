package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HealthBoxBuyerSignupAvailabilityResponse {
    private boolean available;
    private String message;

    public HealthBoxBuyerSignupAvailabilityResponse(boolean available, String message) {
        this.available = available;
        this.message = message;
    }
}
