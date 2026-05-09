package com.lifeline.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, length = 64)
    private String activityType;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public ActivityLog(String description) {
        this.description = description;
        this.activityType = "GENERAL";
    }

    public ActivityLog(String description, String activityType) {
        this.description = description;
        this.activityType = activityType != null ? activityType : "GENERAL";
    }

    @PrePersist
    public void ensureTimestamp() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
        if (activityType == null || activityType.isBlank()) {
            activityType = "GENERAL";
        }
    }
}
