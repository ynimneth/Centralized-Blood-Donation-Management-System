package com.lifeline.controller;

import com.lifeline.model.HospitalBloodRequest;
import com.lifeline.model.User;
import com.lifeline.repository.UserRepository;
import com.lifeline.service.ActivityService;
import com.lifeline.service.HospitalBloodRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hospital-requests")
@CrossOrigin(origins = "http://localhost:5173")
public class HospitalRequestController {

    @Autowired
    private HospitalBloodRequestService hospitalBloodRequestService;

    @Autowired
    private ActivityService activityService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createRequest(@RequestBody Map<String, Object> payload) {
        try {
            Long hospitalUserId = toLong(payload.get("hospitalUserId"));
            if (hospitalUserId == null) {
                throw new RuntimeException("hospitalUserId is required.");
            }
            User hospitalUser = userRepository.findById(hospitalUserId)
                    .orElseThrow(() -> new RuntimeException("Hospital user not found."));

            if (hospitalUser.getRole() != User.Role.HOSPITAL && hospitalUser.getRole() != User.Role.ADMIN) {
                throw new RuntimeException("Only hospital or admin users can create hospital requests.");
            }

            String bloodType = String.valueOf(payload.getOrDefault("bloodType", "UNKNOWN")).toUpperCase();
            int units = toInt(payload.getOrDefault("unitsRequested", 1));
            String priority = String.valueOf(payload.getOrDefault("priority", "NORMAL")).toUpperCase();
            String reason = payload.get("reason") != null ? String.valueOf(payload.get("reason")) : null;

            HospitalBloodRequest created = hospitalBloodRequestService.create(
                    bloodType,
                    units,
                    hospitalUserId,
                    hospitalUser.getName(),
                    priority,
                    reason
            );

            activityService.logActivity(
                    String.format("Hospital request created: %s requested %d unit(s) of %s", hospitalUser.getName(), units, bloodType),
                    "HOSPITAL_REQUEST_CREATED"
            );

            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> listRequests(@RequestParam(required = false) Long hospitalUserId,
                                          @RequestParam(required = false, defaultValue = "ALL") String scope) {
        String normalizedScope = scope == null ? "ALL" : scope.toUpperCase();
        if ("MINE".equals(normalizedScope)) {
            if (hospitalUserId == null) {
                return ResponseEntity.badRequest().body("hospitalUserId is required for scope=MINE");
            }
            return ResponseEntity.ok(hospitalBloodRequestService.getForHospital(hospitalUserId));
        }
        return ResponseEntity.ok(hospitalBloodRequestService.getAll());
    }

    @PutMapping("/{id}/issue")
    public ResponseEntity<?> issueRequest(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Long actingUserId = toLong(payload.get("actingUserId"));
            if (actingUserId == null) {
                throw new RuntimeException("actingUserId is required.");
            }
            User actingUser = userRepository.findById(actingUserId)
                    .orElseThrow(() -> new RuntimeException("Acting user not found."));

            if (actingUser.getRole() != User.Role.ADMIN && actingUser.getRole() != User.Role.LAB) {
                throw new RuntimeException("Only admin or lab users can issue blood units.");
            }

            int units = toInt(payload.getOrDefault("units", 0));
            String adminNotes = payload.get("adminNotes") != null ? String.valueOf(payload.get("adminNotes")) : null;
            HospitalBloodRequest updated = hospitalBloodRequestService.issueUnits(id, units, adminNotes);

            activityService.logActivity(
                    String.format("Hospital request dispatched: %d unit(s) of %s to %s by %s",
                            units, updated.getBloodType(), updated.getHospitalName(), actingUser.getName()),
                    "HOSPITAL_REQUEST_DISPATCHED"
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("request", updated);
            response.put("message", "Hospital request updated.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        return Long.valueOf(String.valueOf(value));
    }

    private int toInt(Object value) {
        if (value == null) {
            return 0;
        }
        return Integer.parseInt(String.valueOf(value));
    }
}
