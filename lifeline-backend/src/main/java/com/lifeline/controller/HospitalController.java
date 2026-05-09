package com.lifeline.controller;

import com.lifeline.model.Hospital;
import com.lifeline.service.HospitalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hospitals")
@CrossOrigin(origins = "http://localhost:5173")
public class HospitalController {

    @Autowired
    private HospitalService hospitalService;

    @GetMapping
    public ResponseEntity<List<Hospital>> getHospitals(@RequestParam(required = false) String province,
                                                       @RequestParam(required = false) String district) {
        return ResponseEntity.ok(hospitalService.getHospitals(province, district));
    }

    @PostMapping
    public ResponseEntity<?> createHospital(@RequestBody Map<String, Object> payload) {
        try {
            String name = asString(payload.get("name"));
            String province = asString(payload.get("province"));
            String district = asString(payload.get("district"));
            String address = asNullableString(payload.get("address"));
            String contactNumber = asNullableString(payload.get("contactNumber"));

            Hospital created = hospitalService.createHospital(name, province, district, address, contactNumber);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHospital(@PathVariable Long id) {
        try {
            Hospital deleted = hospitalService.deleteHospital(id);
            return ResponseEntity.ok(deleted);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    private String asString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String asNullableString(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }
}
