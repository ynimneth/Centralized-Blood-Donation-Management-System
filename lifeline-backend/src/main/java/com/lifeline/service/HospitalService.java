package com.lifeline.service;

import com.lifeline.model.Hospital;
import com.lifeline.repository.HospitalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HospitalService {

    @Autowired
    private HospitalRepository hospitalRepository;

    public List<Hospital> getHospitals(String province, String district) {
        boolean hasProvince = province != null && !province.isBlank();
        boolean hasDistrict = district != null && !district.isBlank();

        if (hasProvince && hasDistrict) {
            return hospitalRepository.findByProvinceAndDistrictOrderByNameAsc(province, district);
        }
        if (hasProvince) {
            return hospitalRepository.findByProvinceOrderByNameAsc(province);
        }
        return hospitalRepository.findAllByOrderByNameAsc();
    }

    public Hospital createHospital(String name, String province, String district, String address, String contactNumber) {
        if (name == null || name.isBlank()) {
            throw new RuntimeException("Hospital name is required.");
        }
        if (province == null || province.isBlank()) {
            throw new RuntimeException("Province is required.");
        }
        if (district == null || district.isBlank()) {
            throw new RuntimeException("District is required.");
        }

        Hospital hospital = new Hospital();
        hospital.setName(name.trim());
        hospital.setProvince(province.trim());
        hospital.setDistrict(district.trim());
        hospital.setAddress(address == null ? null : address.trim());
        hospital.setContactNumber(contactNumber == null ? null : contactNumber.trim());

        return hospitalRepository.save(hospital);
    }

    public Hospital deleteHospital(Long id) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hospital not found."));
        hospitalRepository.delete(hospital);
        return hospital;
    }
}
