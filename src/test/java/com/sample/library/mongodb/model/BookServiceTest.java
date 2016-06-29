package com.sample.library.mongodb.model;

import static org.mockito.Mockito.verify;

import java.util.List;

import org.junit.Before;
import org.junit.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.sample.library.service.impl.BookService;

public class BookServiceTest {

	@Mock
	BookService bookService;


	@Before
	public void init() {
		MockitoAnnotations.initMocks(this);
	}

	@Test
	public void list() {
		
		verify(bookService).list();
	}
	
	@Test
	public void addBook() {
		
		Book book = new Book();
		
		book.setName("fff");
		book.setAuthor("aaaa");
		
		verify(bookService).addBook(book);
	}
	
	@Test
	public void updateBook() {
		
		List<Book> bookList = verify(bookService).list();
		
		Book book = bookList.get(0);
		book.setName("fffrr");
		book.setAuthor("aaaarr");
		
		verify(bookService).updateBook(book);
	}
}
