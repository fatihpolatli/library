package com.sample.library.mongodb.config;

import org.springframework.data.mongodb.MongoDbFactory;
import org.springframework.stereotype.Component;

@Component
public class MongoConfiguration {
	
	private final MongoDbFactory mongo;
	
	public MongoConfiguration(MongoDbFactory mongo){
		
		this.mongo = mongo;
	}
	
	
}
