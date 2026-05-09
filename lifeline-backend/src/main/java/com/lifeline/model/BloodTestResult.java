package com.lifeline.model;

import lombok.Data;

@Data
public class BloodTestResult {
    private String bloodBagId; // Or inventory ID
    private boolean hivPositive;
    private boolean hepatitisPositive;
    private boolean malariaPositive;
    private boolean syphilisPositive;
    
    // Safety Validation Engine Logic:
    // IF any == true -> Bio-Hazard
}
