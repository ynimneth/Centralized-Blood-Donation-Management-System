package com.lifeline.repository;

import com.lifeline.model.EmergencyRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyRequestRepository extends JpaRepository<EmergencyRequest, Long> {
    List<EmergencyRequest> findByStatusOrderByCreatedAtDesc(String status);
    List<EmergencyRequest> findAllByOrderByCreatedAtDesc();
    List<EmergencyRequest> findByHospitalUserIdOrderByCreatedAtDesc(Long hospitalUserId);
}
