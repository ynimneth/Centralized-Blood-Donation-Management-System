package com.lifeline.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 8)
    private String bloodType;

    @Column(nullable = false)
    private Integer unitsRequested;

    @Column(nullable = false)
    private Integer unitsFulfilled;

    @Column(nullable = false, length = 160)
    private String hospital;

    @Column
    private Long hospitalUserId;

    @Column(length = 24)
    private String priority; // NORMAL, HIGH, EMERGENCY

    @Column(nullable = false, length = 32)
    private String urgency;

    @Column(nullable = false, length = 24)
    private String status; // OPEN, PARTIAL, FULFILLED

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @Column(length = 500)
    private String reason;

    @Column(length = 500)
    private String adminNotes;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (unitsFulfilled == null) {
            unitsFulfilled = 0;
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
