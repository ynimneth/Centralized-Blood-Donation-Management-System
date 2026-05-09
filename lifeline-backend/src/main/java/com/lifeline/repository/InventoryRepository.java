package com.lifeline.repository;

import com.lifeline.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findByStatus(String status);
    List<Inventory> findByTestStatus(String testStatus);
    Optional<Inventory> findBySourceAppointmentId(Long sourceAppointmentId);
    List<Inventory> findByBloodTypeIgnoreCase(String bloodType);
}
