package com.lifeline.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "donors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Donor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private String bloodType;
    private LocalDate lastDonationDate;
    private Double weight;
    private String gender;
    private LocalDate dateOfBirth;

    private String safetyStatus; // e.g. "SAFE", "POSITIVE", "BLOCKED"
    private String positiveReason;
}
