package com.lifeline.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class HealthQuestionnaireRequest {
    private Long donorId;
    private LocalDate checkDate;
    private boolean hasDiagnosedDiseases;
    private boolean takingMedications;
    private boolean recentSurgery;
    private boolean recentTravel;
}
