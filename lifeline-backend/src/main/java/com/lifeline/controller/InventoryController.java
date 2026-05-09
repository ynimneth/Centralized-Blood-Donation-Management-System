package com.lifeline.controller;

import com.lifeline.model.Inventory;
import com.lifeline.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "http://localhost:5173")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<Inventory>> getAllStock() {
        return ResponseEntity.ok(inventoryService.getAllStock());
    }

    @GetMapping("/lab/pending")
    public ResponseEntity<List<Inventory>> getPendingLabBags() {
        return ResponseEntity.ok(inventoryService.getPendingLabBags());
    }

    @GetMapping("/{id}/lab-results")
    public ResponseEntity<List<Map<String, Object>>> getLabResultsForBag(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getLabResultsForBag(id));
    }

    @PostMapping("/add")
    public ResponseEntity<Inventory> addBloodBag(@RequestBody Map<String, String> payload) {
        String bloodType = payload.get("bloodType");
        LocalDate expiryDate = LocalDate.parse(payload.get("expiryDate"));
        return ResponseEntity.ok(inventoryService.addBloodBag(bloodType, expiryDate));
    }

    @PutMapping("/{id}/test")
    public ResponseEntity<Void> updateLabResults(@PathVariable Long id, @RequestBody Map<String, Object> results) {
        boolean hiv = (boolean) results.getOrDefault("hiv", false);
        boolean hep = (boolean) results.getOrDefault("hep", false);
        boolean malaria = (boolean) results.getOrDefault("malaria", false);
        String reason = (String) results.get("reason");
        
        inventoryService.updateLabResults(id, hiv, hep, malaria, reason);
        return ResponseEntity.ok().build();
    }
}
