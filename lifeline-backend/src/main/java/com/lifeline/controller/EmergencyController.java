package com.lifeline.controller;

import com.lifeline.model.EmergencyRequest;
import com.lifeline.service.ActivityService;
import com.lifeline.service.EmergencyRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency")
@CrossOrigin(origins = "http://localhost:5173")
public class EmergencyController {

    @Autowired
    private ActivityService activityService;

    @Autowired
    private EmergencyRequestService emergencyRequestService;

    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> requestEmergencyBlood(@RequestBody Map<String, Object> payload) {
        String bloodType = String.valueOf(payload.getOrDefault("bloodType", "UNKNOWN")).toUpperCase();
        int units = toInt(payload.getOrDefault("units", 1));
        String hospital = String.valueOf(payload.getOrDefault("hospital", "Unknown Hospital"));
        String urgency = String.valueOf(payload.getOrDefault("urgency", "NORMAL")).toUpperCase();
        String priority = "CRITICAL".equalsIgnoreCase(urgency) ? "EMERGENCY" : "NORMAL";
        String reason = payload.get("reason") == null ? null : String.valueOf(payload.get("reason"));
        Long hospitalUserId = toLong(payload.get("hospitalUserId"));

        EmergencyRequest savedRequest = emergencyRequestService.create(
                bloodType,
                units,
                hospitalUserId,
                hospital,
                priority,
                urgency,
                reason
        );

        boolean broadcast = emergencyRequestService.isEmergencyUrgency(savedRequest.getUrgency());
        if (broadcast) {
            String activityDesc = String.format("Emergency Alert: %d units of %s needed at %s (%s)",
                    units, bloodType, hospital, urgency);
            activityService.logActivity(activityDesc, "EMERGENCY_BROADCAST");
        } else {
            String activityDesc = String.format("Blood request created: %s requested %d unit(s) of %s (%s)",
                    hospital, units, bloodType, savedRequest.getUrgency());
            activityService.logActivity(activityDesc, "HOSPITAL_REQUEST_CREATED");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put(
                "message",
                broadcast
                        ? "Emergency broadcast sent to all " + bloodType + " donors nearby!"
                        : "Request submitted to Inventory Management queue."
        );
        response.put("bloodType", bloodType);
        response.put("units", units);
        response.put("hospital", hospital);
        response.put("urgency", savedRequest.getUrgency());
        response.put("priority", savedRequest.getPriority());
        response.put("requestId", savedRequest.getId());
        response.put("broadcastTriggered", broadcast);
        response.put("donorsNotified", broadcast ? 150 : 0);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/requests")
    public ResponseEntity<List<EmergencyRequest>> getActiveRequests() {
        return ResponseEntity.ok(emergencyRequestService.getActiveRequests());
    }

    @GetMapping("/requests/all")
    public ResponseEntity<?> getAllRequests(@RequestParam(required = false) String scope,
                                            @RequestParam(required = false) Long hospitalUserId) {
        String normalizedScope = scope == null ? "ALL" : scope.toUpperCase();
        if ("MINE".equals(normalizedScope)) {
            if (hospitalUserId == null) {
                return ResponseEntity.badRequest().body("hospitalUserId is required for scope=MINE");
            }
            return ResponseEntity.ok(emergencyRequestService.getForHospital(hospitalUserId));
        }
        return ResponseEntity.ok(emergencyRequestService.getAllRequests());
    }

    @PutMapping("/requests/{id}/fulfill")
    public ResponseEntity<?> fulfillEmergencyRequest(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            int units = payload.get("units") != null ? Integer.parseInt(payload.get("units").toString()) : 0;
            String adminNotes = payload.get("adminNotes") == null ? null : String.valueOf(payload.get("adminNotes"));
            EmergencyRequest updated = emergencyRequestService.fulfill(id, units, adminNotes);

            boolean emergency = emergencyRequestService.isEmergencyUrgency(updated.getUrgency());
            String activityDesc = emergency
                    ? String.format("Emergency supply dispatched: %d units of %s to %s",
                            units, updated.getBloodType(), updated.getHospital())
                    : String.format("Hospital request dispatched: %d units of %s to %s",
                            units, updated.getBloodType(), updated.getHospital());
            activityService.logActivity(activityDesc, emergency ? "EMERGENCY_FULFILLMENT" : "HOSPITAL_REQUEST_DISPATCHED");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("request", updated);
            response.put("message", "Emergency request updated.");
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
