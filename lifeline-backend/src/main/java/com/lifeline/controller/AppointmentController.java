package com.lifeline.controller;

import com.lifeline.model.Appointment;
import com.lifeline.model.HealthHistory;
import com.lifeline.model.User;
import com.lifeline.repository.UserRepository;
import com.lifeline.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:5173") // Allow React Frontend
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(@RequestBody Map<String, Object> payload) {
        try {
            Long donorId = payload.get("donorId") != null ? Long.valueOf(payload.get("donorId").toString()) : null;
            Long hospitalId = Long.valueOf(payload.get("hospitalId").toString());
            Long donorUserId = payload.get("donorUserId") != null ? Long.valueOf(payload.get("donorUserId").toString()) : null;
            String donorName = payload.get("donorName") != null ? payload.get("donorName").toString() : null;
            String centerType = payload.get("centerType") != null ? payload.get("centerType").toString() : "HOSPITAL";
            String bloodType = payload.get("bloodType") != null ? payload.get("bloodType").toString() : null;
            String centerName = payload.get("centerName") != null ? payload.get("centerName").toString() : null;
            HealthHistory questionnaire = buildQuestionnaireFromPayload(payload);
            // Assuming date is passed as ISO string
            String dateString = payload.get("date").toString();
            LocalDateTime time;
            try {
                time = LocalDateTime.parse(dateString);
            } catch (Exception parseError) {
                time = OffsetDateTime.parse(dateString).toLocalDateTime();
            }

            Appointment appointment = appointmentService.bookAppointment(donorId, hospitalId, time, donorUserId, donorName, centerType, bloodType, centerName, questionnaire);
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error booking appointment");
        }
    }

    @GetMapping("/donor/{donorId}")
    public ResponseEntity<List<Appointment>> getAppointmentsForDonor(@PathVariable Long donorId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsForDonor(donorId));
    }

    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Long actingUserId = toLong(payload.get("actingUserId"));
            ensureCanApproveAppointments(actingUserId);
            String status = payload.getOrDefault("status", "Scheduled").toString();
            Appointment updated = appointmentService.updateStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating status");
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id) {
        try {
            Appointment updated = appointmentService.updateStatus(id, "Cancelled");
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("appointment", updated);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error cancelling appointment");
        }
    }

    private Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        return Long.valueOf(String.valueOf(value));
    }

    private void ensureCanApproveAppointments(Long actingUserId) {
        if (actingUserId == null) {
            throw new RuntimeException("actingUserId is required.");
        }
        User user = userRepository.findById(actingUserId)
                .orElseThrow(() -> new RuntimeException("Acting user not found."));

        if (user.getRole() != User.Role.ADMIN && user.getRole() != User.Role.HOSPITAL) {
            throw new RuntimeException("Only hospital or admin users can approve appointments.");
        }
    }

    private HealthHistory buildQuestionnaireFromPayload(Map<String, Object> payload) {
        boolean hasQuestionnaireData =
                payload.containsKey("hasDiagnosedDiseases")
                        || payload.containsKey("takingMedications")
                        || payload.containsKey("recentSurgery")
                        || payload.containsKey("recentTravel")
                        || payload.containsKey("diseases")
                        || payload.containsKey("medications")
                        || payload.containsKey("surgery")
                        || payload.containsKey("travel");

        if (!hasQuestionnaireData) {
            return null;
        }

        HealthHistory questionnaire = new HealthHistory();
        questionnaire.setHasDiagnosedDiseases(getBooleanFromAny(payload, "hasDiagnosedDiseases", "diseases"));
        questionnaire.setTakingMedications(getBooleanFromAny(payload, "takingMedications", "medications"));
        questionnaire.setRecentSurgery(getBooleanFromAny(payload, "recentSurgery", "surgery"));
        questionnaire.setRecentTravel(getBooleanFromAny(payload, "recentTravel", "travel"));
        return questionnaire;
    }

    private boolean getBooleanFromAny(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            if (payload.containsKey(key)) {
                return toBoolean(payload.get(key));
            }
        }
        return false;
    }

    private boolean toBoolean(Object value) {
        if (value == null) {
            return false;
        }
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        return "true".equalsIgnoreCase(String.valueOf(value).trim());
    }
}
