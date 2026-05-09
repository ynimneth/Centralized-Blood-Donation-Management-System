package com.lifeline.service;

import com.lifeline.model.Inventory;
import com.lifeline.repository.InventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class StockService {

    @Autowired
    private InventoryRepository inventoryRepository;

    public List<Inventory> getAllStock() {
        return inventoryRepository.findAll();
    }

    // Run daily at midnight to check for expired stock
    @Scheduled(cron = "0 0 0 * * ?")
    public void expiryMonitor() {
        List<Inventory> allStock = inventoryRepository.findAll();
        LocalDate today = LocalDate.now();

        for (Inventory item : allStock) {
            if (item.getExpiryDate() != null && today.isAfter(item.getExpiryDate())) {
                if (!"Expired".equals(item.getStatus()) && !"Bio-Hazard".equals(item.getStatus())) {
                    item.setStatus("Expired");
                    inventoryRepository.save(item);
                    System.out.println("Marked Inventory ID " + item.getId() + " as Expired.");
                }
            }
        }
    }
}
