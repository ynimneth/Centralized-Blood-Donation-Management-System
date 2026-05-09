package com.lifeline.repository;

import com.lifeline.model.HospitalBloodRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HospitalBloodRequestRepository extends JpaRepository<HospitalBloodRequest, Long> {
    List<HospitalBloodRequest> findAllByOrderByCreatedAtDesc();
    List<HospitalBloodRequest> findByHospitalUserIdOrderByCreatedAtDesc(Long hospitalUserId);
}
