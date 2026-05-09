package com.lifeline.repository;

import com.lifeline.model.LabTestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabTestResultRepository extends JpaRepository<LabTestResult, Long> {
    List<LabTestResult> findByInventory_IdOrderByTestedAtDesc(Long inventoryId);
}
