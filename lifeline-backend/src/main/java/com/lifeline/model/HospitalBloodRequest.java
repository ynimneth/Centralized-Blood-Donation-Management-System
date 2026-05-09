package com.lifeline.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "hospital_blood_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HospitalBloodRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 8)
    private String bloodType;

    @Column(nullable = false)
    private Integer unitsRequested;

    @Column(nullable = false)
    private Integer unitsIssued;

    @Column(nullable = false, length = 160)
    private String hospitalName;

    @Column(nullable = false)
    private Long hospitalUserId;

    @Column(nullable = false, length = 24)
    private String priority; // NORMAL, HIGH

    @Column(nullable = false, length = 24)
    private String status; // OPEN, PARTIAL, ISSUED

    @Column(length = 500)
    private String reason;

    @Column(length = 500)
    private String adminNotes;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (unitsIssued == null) {
            unitsIssued = 0;
        }
        if (priority == null || priority.isBlank()) {
            priority = "NORMAL";
        }
        if (status == null || status.isBlank()) {
            status = "OPEN";
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
