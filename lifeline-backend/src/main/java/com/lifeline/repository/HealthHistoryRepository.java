package com.lifeline.repository;

import com.lifeline.model.HealthHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HealthHistoryRepository extends JpaRepository<HealthHistory, Long> {
}
