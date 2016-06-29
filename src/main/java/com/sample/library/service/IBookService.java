package com.sample.library.service;

import java.util.List;

import com.sample.library.mongodb.model.Book;

public interface IBookService {

	String SERVICE_NAME = "BOOK_SERVICE";

	public List<Book> list();

	List<Book> findBooks(String id);

	Book findBook(String id);

	Book addBook(Book book);

	Book updateBook(Book book);

	void deleteBook(Book book);
}
