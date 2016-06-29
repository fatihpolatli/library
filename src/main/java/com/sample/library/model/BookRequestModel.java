package com.sample.library.model;

import com.sample.library.mongodb.model.Book;

public class BookRequestModel  extends Book{

	
	private String captcha;

	public String getCaptcha() {
		return captcha;
	}

	public void setCaptcha(String captcha) {
		this.captcha = captcha;
	}
	

}
