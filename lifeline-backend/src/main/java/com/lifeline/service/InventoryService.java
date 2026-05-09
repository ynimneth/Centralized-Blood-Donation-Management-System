package com.lifeline.service;

import com.lifeline.model.Donor;
import com.lifeline.model.Inventory;
import com.lifeline.model.LabTestResult;
import com.lifeline.repository.AppointmentRepository;
import com.lifeline.repository.DonorRepository;
import com.lifeline.repository.InventoryRepository;
import com.lifeline.repository.LabTestResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private LabTestResultRepository labTestResultRepository;
    
    @Autowired
    private AppointmentRepository appointmentRepository;

    public Inventory addBloodBag(Inventory bag) {
        return inventoryRepository.save(bag);
    }

    public Inventory addBloodBag(String bloodType, LocalDate expiryDate) {
        Inventory bag = new Inventory();
        bag.setBloodType(bloodType);
        bag.setExpiryDate(expiryDate);
        bag.setStatus("UNTESTED");
        bag.setTestStatus("PENDING");
        bag.setQuantity(1); // Default
        return inventoryRepository.save(bag);
    }

    public void updateLabResults(Long bagId, boolean hivPos, boolean hepPos, boolean malariaPos, String reason) {
        Inventory bag = inventoryRepository.findById(bagId)
                .orElseThrow(() -> new RuntimeException("Blood bag not found"));

        boolean positive = hivPos || hepPos || malariaPos;

        if (positive) {
            bag.setSafetyFlag("BIO-HAZARD");
            bag.setStatus("DISCARD");
            bag.setTestStatus("TESTED_UNSAFE");

            // Always mark donor profile as POSITIVE when any lab marker is positive.
            markDonorAsPositive(bag, reason);
        } else {
            bag.setSafetyFlag("SAFE");
            bag.setStatus("AVAILABLE");
            bag.setTestStatus("TESTED_SAFE");
        }

        Inventory savedBag = inventoryRepository.save(bag);
        saveLabTestResult(savedBag, hivPos, hepPos, malariaPos, reason, positive ? "UNSAFE" : "SAFE");
    }

    @Scheduled(cron = "0 0 0 * * ?") // Runs daily at midnight
    @Transactional
    public void checkExpiry() {
        List<Inventory> allInventory = inventoryRepository.findAll();
        LocalDate today = LocalDate.now();

        for (Inventory item : allInventory) {
            if (item.getExpiryDate() != null && item.getExpiryDate().isBefore(today)) {
                if (!"EXPIRED".equals(item.getStatus())) {
                    item.setStatus("EXPIRED");
                    inventoryRepository.save(item);
                }
            }
        }
    }

    public List<Inventory> getAllStock() {
        return inventoryRepository.findAll();
    }

    public List<Inventory> getPendingLabBags() {
        return inventoryRepository.findByTestStatus("PENDING");
    }

    public List<Map<String, Object>> getLabResultsForBag(Long bagId) {
        if (!inventoryRepository.existsById(bagId)) {
            throw new RuntimeException("Blood bag not found");
        }
        return labTestResultRepository.findByInventory_IdOrderByTestedAtDesc(bagId)
                .stream()
                .map(result -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("id", result.getId());
                    row.put("inventoryId", bagId);
                    row.put("hivPositive", result.isHivPositive());
                    row.put("hepPositive", result.isHepPositive());
                    row.put("malariaPositive", result.isMalariaPositive());
                    row.put("overallResult", result.getOverallResult());
                    row.put("reason", result.getReason());
                    row.put("testedAt", result.getTestedAt());
                    return row;
                })
                .toList();
    }

    private void saveLabTestResult(Inventory bag, boolean hivPos, boolean hepPos, boolean malariaPos, String reason, String outcome) {
        LabTestResult testResult = new LabTestResult();
        testResult.setInventory(bag);
        testResult.setHivPositive(hivPos);
        testResult.setHepPositive(hepPos);
        testResult.setMalariaPositive(malariaPos);
        testResult.setReason(reason);
        testResult.setOverallResult(outcome);
        testResult.setTestedAt(java.time.LocalDateTime.now());
        labTestResultRepository.save(testResult);
    }

    private void markDonorAsPositive(Inventory bag, String reason) {
        String normalizedReason = (reason != null && !reason.isBlank())
                ? reason
                : "Tested positive for blood-borne diseases";

        Donor donorToUpdate = null;

        if (bag.getDonorUserId() != null) {
            donorToUpdate = donorRepository.findByUser_Id(bag.getDonorUserId()).orElse(null);
        }

        // Fallback: resolve donor through source appointment link.
        if (donorToUpdate == null && bag.getSourceAppointmentId() != null) {
            donorToUpdate = appointmentRepository.findById(bag.getSourceAppointmentId())
                    .map(appt -> appt.getDonor())
                    .orElse(null);
        }

        if (donorToUpdate != null) {
            donorToUpdate.setSafetyStatus("POSITIVE");
            donorToUpdate.setPositiveReason(normalizedReason);
            donorRepository.save(donorToUpdate);
        }
    }
}
