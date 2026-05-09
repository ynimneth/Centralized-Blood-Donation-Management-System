package com.lifeline.service;

import com.lifeline.model.Inventory;
import com.lifeline.repository.InventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class BloodDispatchService {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Transactional
    public int consumeUsableStock(String bloodType, int needed) {
        int remaining = needed;
        LocalDate today = LocalDate.now();

        List<Inventory> candidates = inventoryRepository.findAll().stream()
                .filter(item -> bloodType.equalsIgnoreCase(item.getBloodType()))
                .filter(item -> item.getQuantity() != null && item.getQuantity() > 0)
                .filter(item -> item.getExpiryDate() == null || !item.getExpiryDate().isBefore(today))
                .filter(item -> {
                    String safety = item.getSafetyFlag() == null ? "" : item.getSafetyFlag().toUpperCase();
                    String status = item.getStatus() == null ? "" : item.getStatus().toUpperCase();
                    return "SAFE".equals(safety) || "SAFE".equals(status) || "AVAILABLE".equals(status);
                })
                .sorted(Comparator.comparing(Inventory::getExpiryDate, Comparator.nullsLast(LocalDate::compareTo)))
                .toList();

        for (Inventory bag : candidates) {
            if (remaining <= 0) {
                break;
            }
            int qty = bag.getQuantity();
            int use = Math.min(qty, remaining);
            bag.setQuantity(qty - use);
            if (bag.getQuantity() == 0) {
                bag.setStatus("USED");
            }
            inventoryRepository.save(bag);
            remaining -= use;
        }

        return needed - remaining;
    }
}
