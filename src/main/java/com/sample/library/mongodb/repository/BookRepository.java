package com.sample.library.mongodb.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.sample.library.mongodb.model.Book;

public interface BookRepository extends MongoRepository<Book,String>{

	List<Book> findById(String id);
	
	Book findOneById(String id);
	
	
}
