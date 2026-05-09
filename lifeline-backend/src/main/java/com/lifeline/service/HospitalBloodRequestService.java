package com.lifeline.service;

import com.lifeline.model.HospitalBloodRequest;
import com.lifeline.repository.HospitalBloodRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HospitalBloodRequestService {

    @Autowired
    private HospitalBloodRequestRepository hospitalBloodRequestRepository;

    @Autowired
    private BloodDispatchService bloodDispatchService;

    public HospitalBloodRequest create(String bloodType, int units, Long hospitalUserId, String hospitalName, String priority, String reason) {
        if (hospitalUserId == null) {
            throw new RuntimeException("Hospital user is required.");
        }
        if (units <= 0) {
            throw new RuntimeException("Units requested must be greater than zero.");
        }

        HospitalBloodRequest request = new HospitalBloodRequest();
        request.setBloodType(bloodType);
        request.setUnitsRequested(units);
        request.setUnitsIssued(0);
        request.setHospitalUserId(hospitalUserId);
        request.setHospitalName(hospitalName);
        request.setPriority(priority == null || priority.isBlank() ? "NORMAL" : priority.toUpperCase());
        request.setReason(reason);
        request.setStatus("OPEN");
        return hospitalBloodRequestRepository.save(request);
    }

    public List<HospitalBloodRequest> getAll() {
        return hospitalBloodRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<HospitalBloodRequest> getForHospital(Long hospitalUserId) {
        return hospitalBloodRequestRepository.findByHospitalUserIdOrderByCreatedAtDesc(hospitalUserId);
    }

    @Transactional
    public HospitalBloodRequest issueUnits(Long requestId, int units, String adminNotes) {
        HospitalBloodRequest request = hospitalBloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Hospital blood request not found."));

        if (units <= 0) {
            throw new RuntimeException("Units to issue must be greater than zero.");
        }

        int remaining = request.getUnitsRequested() - request.getUnitsIssued();
        if (remaining <= 0) {
            throw new RuntimeException("Request has already been fully issued.");
        }

        int toIssue = Math.min(units, remaining);
        int issuedFromStock = bloodDispatchService.consumeUsableStock(request.getBloodType(), toIssue);
        if (issuedFromStock <= 0) {
            throw new RuntimeException("No usable stock available for blood type " + request.getBloodType());
        }

        request.setUnitsIssued(request.getUnitsIssued() + issuedFromStock);
        request.setAdminNotes(adminNotes);
        if (request.getUnitsIssued() >= request.getUnitsRequested()) {
            request.setStatus("ISSUED");
        } else {
            request.setStatus("PARTIAL");
        }

        return hospitalBloodRequestRepository.save(request);
    }
}
