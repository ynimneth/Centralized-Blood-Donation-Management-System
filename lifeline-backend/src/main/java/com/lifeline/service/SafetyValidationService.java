package com.lifeline.service;

import com.lifeline.model.BloodTestResult;
import com.lifeline.model.Inventory;
import com.lifeline.repository.InventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SafetyValidationService {

    @Autowired
    private InventoryRepository inventoryRepository;

    public Inventory validateBloodBag(Long inventoryId, BloodTestResult testResult) {
        Inventory inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Blood bag not found"));

        boolean isBioHazard = testResult.isHivPositive() || 
                              testResult.isHepatitisPositive() || 
                              testResult.isMalariaPositive() || 
                              testResult.isSyphilisPositive();

        if (isBioHazard) {
            inventory.setStatus("Bio-Hazard");
            inventory.setTestStatus("TESTED_UNSAFE");
            // Logic to trigger disposal process audit could be added here
        } else {
            inventory.setStatus("Safe");
            inventory.setTestStatus("TESTED_SAFE");
        }

        return inventoryRepository.save(inventory);
    }
}
