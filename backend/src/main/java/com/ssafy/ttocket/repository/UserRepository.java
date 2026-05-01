package com.ssafy.ttocket.repository;

import com.ssafy.ttocket.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findById(String userId);
}
