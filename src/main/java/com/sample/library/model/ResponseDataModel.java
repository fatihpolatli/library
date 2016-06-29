package com.sample.library.model;


public class ResponseDataModel {

	private Object data;
	private int code;
	private String error;
	private String message;

	public static ResponseDataModel createSuccessResponseWithData(Object data) {
		return new ResponseDataModel(data, 200, "Successful", "");
	}

	public static ResponseDataModel createSuccessResponse() {
		return new ResponseDataModel(null, 200, "Successful", "");
	}

	public static ResponseDataModel createErrorResponse(int errorCode, String errorMessage) {
		return new ResponseDataModel(null, errorCode, "Error", errorMessage);
	}

	public ResponseDataModel(Object data, int code, String message, String error) {
		super();
		this.data = data;
		this.code = code;
		this.error = error;
		this.message = message;
	}

	public Object getData() {
		return data;
	}

	public void setData(Object data) {
		this.data = data;
	}

	public int getCode() {
		return code;
	}

	public void setCode(int code) {
		this.code = code;
	}

	public String getError() {
		return error;
	}

	public void setError(String error) {
		this.error = error;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

}
