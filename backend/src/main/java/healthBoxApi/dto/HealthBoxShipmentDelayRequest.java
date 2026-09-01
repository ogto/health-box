package healthBoxApi.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class HealthBoxShipmentDelayRequest {
    private String reason;
    private LocalDate expectedShipDate;
}
