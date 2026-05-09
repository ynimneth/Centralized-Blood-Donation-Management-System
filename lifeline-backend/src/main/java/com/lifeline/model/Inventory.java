package com.lifeline.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String bloodType;
    private Integer quantity; // Representing number of bags or units
    private LocalDate expiryDate;
    
    private String status; // Safe, Bio-Hazard, Expired
    private String safetyFlag; // SAFE, BIO-HAZARD
    private String testStatus; // PENDING, TESTED_SAFE, TESTED_UNSAFE
    private String donorName;
    private Long donorUserId;
    private LocalDateTime collectedAt;
    private Long sourceAppointmentId;

    // Optional: Link to a specific collection/donation if tracking individual bags extensively
}
