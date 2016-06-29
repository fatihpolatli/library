package com.sample.library.controller;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.github.mkopylec.recaptcha.validation.RecaptchaValidator;
import com.github.mkopylec.recaptcha.validation.ValidationResult;
import com.sample.library.model.BookRequestModel;
import com.sample.library.model.ResponseDataModel;
import com.sample.library.mongodb.model.Book;
import com.sample.library.service.IBookService;
import com.sample.library.utils.ValidationErrorMessageUtil;

@RestController
@RequestMapping("/restful/books")
public class BookController {

	@Autowired
	@Qualifier(IBookService.SERVICE_NAME)
	private IBookService bookService;
	
	@Autowired
	private RecaptchaValidator recaptchaValidator;

	@RequestMapping(value = "/list", method = RequestMethod.GET)
	public ResponseDataModel getList() {

		try {

			return ResponseDataModel.createSuccessResponseWithData(bookService.list());

		} catch (Exception e) {
			// TODO: handle exception

			return ResponseDataModel.createErrorResponse(2001, e.getMessage());
		}

	}

	@RequestMapping(value = "/{id}", method = RequestMethod.GET)
	public ResponseDataModel getBookById(@PathVariable String id) {

		try {

			return ResponseDataModel.createSuccessResponseWithData(bookService.findBook(id));

		} catch (Exception e) {
			// TODO: handle exception

			return ResponseDataModel.createErrorResponse(2001, e.getMessage());
		}

	}

	@RequestMapping(value = "/add/", method = RequestMethod.POST)
	public ResponseDataModel addBook(@Valid @RequestBody BookRequestModel book, BindingResult bindingResult) {

		try {

			if (bindingResult.hasErrors()) {

				return ResponseDataModel.createErrorResponse(2002, ValidationErrorMessageUtil.getValidationErrorMessage(bindingResult));
			}
			
			ValidationResult result = recaptchaValidator.validate(book.getCaptcha());
			
			if(result.isFailure()){
				
				return ResponseDataModel.createErrorResponse(2003, ValidationErrorMessageUtil.wrongCaptchaErrorMessage());
			}

			return ResponseDataModel.createSuccessResponseWithData(bookService.addBook(book));

		} catch (Exception e) {
			// TODO: handle exception

			return ResponseDataModel.createErrorResponse(2001, e.getMessage());
		}

	}

	@RequestMapping(value = "/update", method = RequestMethod.POST)
	public ResponseDataModel updateBook(@Valid @RequestBody Book book, BindingResult bindingResult) {

		try {

			if (bindingResult.hasErrors()) {

				return ResponseDataModel.createErrorResponse(2001, ValidationErrorMessageUtil.getValidationErrorMessage(bindingResult));
			}

			return ResponseDataModel.createSuccessResponseWithData(bookService.updateBook(book));

		} catch (Exception e) {
			// TODO: handle exception

			return ResponseDataModel.createErrorResponse(2001, e.getMessage());
		}

	}

	@RequestMapping(value = "/delete", method = RequestMethod.POST)
	public ResponseDataModel deleteBook(@RequestBody Book book) {

		try {

			bookService.deleteBook(book);
			return ResponseDataModel.createSuccessResponseWithData(true);

		} catch (Exception e) {
			// TODO: handle exception

			return ResponseDataModel.createErrorResponse(2001, e.getMessage());
		}

	}
	

    @RequestMapping(value = "/validateCaptcha", method = RequestMethod.POST)
    public ResponseDataModel validateCaptcha(HttpServletRequest request) {
        ValidationResult result = recaptchaValidator.validate(request);
        if (result.isSuccess()) {
        	
        	return ResponseDataModel.createSuccessResponseWithData(true);
        	
        }
        
        return ResponseDataModel.createErrorResponse(2003, ValidationErrorMessageUtil.wrongCaptchaErrorMessage());
    }
}