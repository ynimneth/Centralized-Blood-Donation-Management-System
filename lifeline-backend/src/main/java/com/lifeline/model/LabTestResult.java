package com.lifeline.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "lab_test_results",
        indexes = {
                @Index(name = "idx_lab_test_inventory_id", columnList = "inventory_id"),
                @Index(name = "idx_lab_test_tested_at", columnList = "tested_at")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LabTestResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inventory_id", nullable = false)
    private Inventory inventory;

    @Column(nullable = false)
    private boolean hivPositive;

    @Column(nullable = false)
    private boolean hepPositive;

    @Column(nullable = false)
    private boolean malariaPositive;

    @Column(nullable = false, length = 32)
    private String overallResult;

    @Column(length = 255)
    private String reason;

    @Column(nullable = false, name = "tested_at")
    private LocalDateTime testedAt;
}
