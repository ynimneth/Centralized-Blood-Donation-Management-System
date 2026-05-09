package com.lifeline.service;

import com.lifeline.model.Donor;
import com.lifeline.model.HealthHistory;
import com.lifeline.repository.DonorRepository;
import com.lifeline.repository.HealthHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;

@Service
public class EligibilityService {

    @Autowired
    private DonorRepository donorRepository;
    @Autowired
    private HealthHistoryRepository healthHistoryRepository;

    public boolean checkBasicEligibility(Long donorId) {
        Donor donor = donorRepository.findById(donorId).orElseThrow(() -> new RuntimeException("Donor not found"));
        
        // Rule 1: Age Check (18-60)
        int age = Period.between(donor.getDateOfBirth(), LocalDate.now()).getYears();
        if (age < 18 || age > 60) {
            return false;
        }

        // Rule 2: Weight Check (> 50kg)
        if (donor.getWeight() < 50.0) {
            return false;
        }

        // Rule 3: Last Donation Date (> 90 days)
        if (donor.getLastDonationDate() != null) {
            long daysSinceLastDonation = ChronoUnit.DAYS.between(donor.getLastDonationDate(), LocalDate.now());
            if (daysSinceLastDonation < 90) {
                return false;
            }
        }

        return true;
    }

    public boolean evaluateHealthQuestionnaire(HealthHistory history) {
        // If any risk factor is true, donor is ineligible
        if (history.isHasDiagnosedDiseases() || 
            history.isTakingMedications() || 
            history.isRecentSurgery() || 
            history.isRecentTravel()) {
            return false;
        }
        return true;
    }

    public HealthHistory submitHealthQuestionnaire(Long donorId, HealthHistory questionnaire) {
        if (donorId == null) {
            throw new IllegalArgumentException("donorId is required");
        }

        Donor donor = donorRepository.findById(donorId)
                .orElseThrow(() -> new RuntimeException("Donor not found"));
        if (donor.getUser() == null) {
            throw new RuntimeException("Donor is not linked to a user account.");
        }

        HealthHistory history = new HealthHistory();
        history.setUser(donor.getUser());
        history.setCheckDate(questionnaire.getCheckDate() != null ? questionnaire.getCheckDate() : LocalDate.now());
        history.setHasDiagnosedDiseases(questionnaire.isHasDiagnosedDiseases());
        history.setTakingMedications(questionnaire.isTakingMedications());
        history.setRecentSurgery(questionnaire.isRecentSurgery());
        history.setRecentTravel(questionnaire.isRecentTravel());
        history.setEligible(evaluateHealthQuestionnaire(questionnaire));

        return healthHistoryRepository.save(history);
    }
}
