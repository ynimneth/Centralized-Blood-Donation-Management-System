package com.lifeline.repository;

import com.lifeline.model.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Long> {
    List<Hospital> findAllByOrderByNameAsc();
    List<Hospital> findByProvinceOrderByNameAsc(String province);
    List<Hospital> findByProvinceAndDistrictOrderByNameAsc(String province, String district);
}
