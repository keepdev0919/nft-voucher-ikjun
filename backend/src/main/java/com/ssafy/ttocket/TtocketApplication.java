package com.ssafy.ttocket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class TtocketApplication {
	public static void main(String[] args) {
		SpringApplication.run(TtocketApplication.class, args);
	}

}
