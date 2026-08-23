package healthBoxApi.payload;

public class ApiResponse {
    private Boolean success;
    private String message;
    private Object rtnModel;

    public ApiResponse(Boolean success, String message, Object rtnModel) {
        this.success = success;
        this.message = message;
        this.rtnModel = rtnModel;
    }

    public ApiResponse(Boolean success, String message) {
        this(success, message, null);
    }

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Object getRtnModel() {
        return rtnModel;
    }

    public void setRtnModel(Object rtnModel) {
        this.rtnModel = rtnModel;
    }
}
