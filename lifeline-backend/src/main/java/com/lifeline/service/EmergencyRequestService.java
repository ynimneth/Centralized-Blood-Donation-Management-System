package com.lifeline.service;

import com.lifeline.model.EmergencyRequest;
import com.lifeline.repository.EmergencyRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmergencyRequestService {

    @Autowired
    private EmergencyRequestRepository emergencyRequestRepository;

    @Autowired
    private BloodDispatchService bloodDispatchService;

    public EmergencyRequest create(String bloodType,
                                   int units,
                                   Long hospitalUserId,
                                   String hospital,
                                   String priority,
                                   String urgency,
                                   String reason) {
        if (units <= 0) {
            throw new RuntimeException("Units requested must be greater than zero.");
        }
        EmergencyRequest request = new EmergencyRequest();
        request.setBloodType(bloodType);
        request.setUnitsRequested(units);
        request.setUnitsFulfilled(0);
        request.setHospitalUserId(hospitalUserId);
        request.setHospital(hospital);
        request.setPriority(normalizePriority(priority));
        request.setUrgency(normalizeUrgency(urgency));
        request.setReason(reason);
        request.setStatus("OPEN");
        return emergencyRequestRepository.save(request);
    }

    public List<EmergencyRequest> getActiveRequests() {
        return emergencyRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(r -> isEmergencyUrgency(r.getUrgency()))
                .filter(r -> !"FULFILLED".equalsIgnoreCase(r.getStatus()))
                .toList();
    }

    public List<EmergencyRequest> getAllRequests() {
        return emergencyRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<EmergencyRequest> getForHospital(Long hospitalUserId) {
        return emergencyRequestRepository.findByHospitalUserIdOrderByCreatedAtDesc(hospitalUserId);
    }

    @Transactional
    public EmergencyRequest fulfill(Long requestId, int unitsToSend, String adminNotes) {
        EmergencyRequest request = emergencyRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Emergency request not found"));

        if (unitsToSend <= 0) {
            throw new RuntimeException("Units to send must be greater than zero.");
        }

        int remaining = request.getUnitsRequested() - request.getUnitsFulfilled();
        if (remaining <= 0) {
            throw new RuntimeException("Request already fulfilled.");
        }

        int send = Math.min(remaining, unitsToSend);
        int sentFromStock = bloodDispatchService.consumeUsableStock(request.getBloodType(), send);
        if (sentFromStock <= 0) {
            throw new RuntimeException("No usable stock available for blood type " + request.getBloodType());
        }

        request.setUnitsFulfilled(request.getUnitsFulfilled() + sentFromStock);
        request.setAdminNotes(adminNotes);
        if (request.getUnitsFulfilled() >= request.getUnitsRequested()) {
            request.setStatus("FULFILLED");
            return emergencyRequestRepository.save(request);
        }

        request.setStatus("PARTIAL");
        return emergencyRequestRepository.save(request);
    }

    public boolean isEmergencyPriority(String priority) {
        return "EMERGENCY".equalsIgnoreCase(normalizePriority(priority));
    }

    public boolean isEmergencyUrgency(String urgency) {
        return "CRITICAL".equalsIgnoreCase(normalizeUrgency(urgency));
    }

    private String normalizePriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return "NORMAL";
        }
        String normalized = priority.trim().toUpperCase();
        return switch (normalized) {
            case "NORMAL", "HIGH", "EMERGENCY" -> normalized;
            default -> "NORMAL";
        };
    }

    private String normalizeUrgency(String urgency) {
        if (urgency == null || urgency.isBlank()) {
            return "NORMAL";
        }
        String normalized = urgency.trim().toUpperCase();
        return switch (normalized) {
            case "CRITICAL" -> "CRITICAL";
            default -> "NORMAL";
        };
    }
}
