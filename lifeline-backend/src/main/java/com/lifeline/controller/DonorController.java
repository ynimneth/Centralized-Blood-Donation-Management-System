package com.lifeline.controller;

import com.lifeline.dto.HealthQuestionnaireRequest;
import com.lifeline.model.HealthHistory;
import com.lifeline.service.EligibilityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/donors")
public class DonorController {

    @Autowired
    private com.lifeline.service.DonorService donorService;
    @Autowired
    private EligibilityService eligibilityService;

    @GetMapping("/{id}/eligibility")
    public ResponseEntity<?> checkBasicEligibility(@PathVariable Long id) {
        return ResponseEntity.ok(donorService.getEligibilityDetails(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<com.lifeline.model.Donor> getDonorByUserId(@PathVariable Long userId) {
        return donorService.getDonorByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/health-check")
    public ResponseEntity<?> evaluateHealthQuestionnaire(@RequestBody HealthQuestionnaireRequest request) {
        if (request.getDonorId() == null) {
            return ResponseEntity.badRequest().body("donorId is required");
        }

        HealthHistory history = new HealthHistory();
        history.setCheckDate(request.getCheckDate());
        history.setHasDiagnosedDiseases(request.isHasDiagnosedDiseases());
        history.setTakingMedications(request.isTakingMedications());
        history.setRecentSurgery(request.isRecentSurgery());
        history.setRecentTravel(request.isRecentTravel());

        HealthHistory savedHistory = eligibilityService.submitHealthQuestionnaire(request.getDonorId(), history);
        return ResponseEntity.ok(savedHistory);
    }
}
