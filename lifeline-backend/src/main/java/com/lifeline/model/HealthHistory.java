package com.lifeline.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "health_histories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private LocalDate checkDate;
    
    // Questionnaire answers
    private boolean hasDiagnosedDiseases; // HIV, Hepatitis, etc.
    private boolean takingMedications;
    private boolean recentSurgery;
    private boolean recentTravel; // Malaria risk zones
    
    // Outcome
    private boolean isEligible;
}
