package com.sample.library.utils;

import org.springframework.validation.BindingResult;

public class ValidationErrorMessageUtil {

	public static String getValidationErrorMessage(BindingResult bindingResult) {

		return bindingResult.getFieldError().getField() + " is " + bindingResult.getFieldError().getRejectedValue() + " : "
				+ bindingResult.getFieldError().getDefaultMessage();
	}
	
	public static String wrongCaptchaErrorMessage(){
		
		return "Wrong Captcha";
	}
}
