package com.sample.library.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sample.library.mongodb.model.Book;
import com.sample.library.mongodb.repository.BookRepository;
import com.sample.library.service.IBookService;

@Service(value=IBookService.SERVICE_NAME)
public class BookService implements IBookService{

	@Autowired
	private BookRepository bookRepository;
	
	@Override
	public List<Book> list() {
		// TODO Auto-generated method stub
		return bookRepository.findAll();
	}
	
	@Override
	public List<Book> findBooks(String id) {
		// TODO Auto-generated method stub
		return bookRepository.findById(id);
	}
	
	@Override
	public Book findBook(String id) {
		// TODO Auto-generated method stub
		return bookRepository.findOneById(id);
	}
	
	@Override
	public Book addBook(Book book) {
		// TODO Auto-generated method stub
		return bookRepository.insert(book);
	}
	
	@Override
	public Book updateBook(Book book) {
		// TODO Auto-generated method stub
		return bookRepository.save(book);
	}
	
	@Override
	public void deleteBook(Book book) {
		// TODO Auto-generated method stub
		bookRepository.delete(book);
	}

}
