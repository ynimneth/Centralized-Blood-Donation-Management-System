package com.lifeline.repository;

import com.lifeline.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByNicNoAndPhoneNumber(String nicNo, String phoneNumber);
    Optional<User> findByNicNo(String nicNo);
    Optional<User> findByPhoneNumber(String phoneNumber);
    java.util.List<User> findAllByOrderByIdAsc();
}
