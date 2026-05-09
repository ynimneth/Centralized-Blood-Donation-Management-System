package com.lifeline.service;

import com.lifeline.model.Appointment;
import com.lifeline.model.Donor;
import com.lifeline.repository.AppointmentRepository;
import com.lifeline.repository.DonorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class DonorService {
    private static final long DONATION_COOLDOWN_DAYS = 90;

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    public boolean checkEligibility(Long id) {
        Map<String, Object> details = getEligibilityDetails(id);
        return (boolean) details.getOrDefault("eligible", true);
    }

    public java.util.Map<String, Object> getEligibilityDetails(Long id) {
        // Try User ID first
        Donor donor = donorRepository.findByUser_Id(id).orElse(null);
        
        // If not found, try as Donor ID
        if (donor == null) {
            donor = donorRepository.findById(id).orElse(null);
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        if (donor == null) {
            result.put("eligible", true);
            return result;
        }

        // 1. Check if permanently blocked due to positive test
        if ("POSITIVE".equalsIgnoreCase(donor.getSafetyStatus()) || "BLOCKED".equalsIgnoreCase(donor.getSafetyStatus())) {
            String positiveReason = donor.getPositiveReason();
            String reason = (positiveReason != null && !positiveReason.isBlank())
                    ? "You are not eligible to donate because your latest lab test was marked positive (" + positiveReason + "). Please consult a doctor."
                    : "You are not eligible to donate because your latest lab test was marked positive.";
            result.put("eligible", false);
            result.put("reason", reason);
            result.put("type", "SAFETY");
            result.put("safetyStatus", donor.getSafetyStatus());
            if (positiveReason != null && !positiveReason.isBlank()) {
                result.put("positiveReason", positiveReason);
            }
            return result;
        }

        // 2. Check the 90-day cooldown from the donor's latest booking or completed donation
        LocalDate today = LocalDate.now();
        LocalDate restrictionStartDate = getLatestRestrictedDate(donor);
        if (restrictionStartDate != null) {
            long daysSinceLastBooking = ChronoUnit.DAYS.between(restrictionStartDate, today);
            if (daysSinceLastBooking < DONATION_COOLDOWN_DAYS) {
                long daysRemaining = DONATION_COOLDOWN_DAYS - daysSinceLastBooking;
                LocalDate nextEligibleDate = restrictionStartDate.plusDays(DONATION_COOLDOWN_DAYS);
                result.put("eligible", false);
                result.put("reason", "You already have a recent donation appointment. Please wait about 3 months before booking again.");
                result.put("daysRemaining", daysRemaining);
                result.put("nextEligibleDate", nextEligibleDate.toString());
                result.put("type", "RECENT_DONATION");
                return result;
            }
        }

        result.put("eligible", true);
        return result;
    }

    public boolean isEligibleForDate(Donor donor, LocalDate targetDate) {
        if (donor == null) return true;

        // 1. Check if permanently blocked due to positive test
        if ("POSITIVE".equalsIgnoreCase(donor.getSafetyStatus()) || "BLOCKED".equalsIgnoreCase(donor.getSafetyStatus())) {
            return false;
        }

        // 2. Check the 90-day gap from the donor's most recent booking/donation date
        LocalDate restrictionStartDate = getLatestRestrictedDate(donor);
        if (restrictionStartDate != null) {
            long daysSinceLastBooking = ChronoUnit.DAYS.between(restrictionStartDate, targetDate);
            if (daysSinceLastBooking >= 0 && daysSinceLastBooking < DONATION_COOLDOWN_DAYS) {
                return false;
            }
            if (daysSinceLastBooking < 0) {
                return false;
            }
        }

        return true;
    }

    public Donor registerDonor(Donor donor) {
        // In a real app, we might check if user already exists, etc.
        // For now, just save the donor details as requested.
        return donorRepository.save(donor);
    }

    public java.util.Optional<Donor> getDonorByUserId(Long userId) {
        return donorRepository.findByUser_Id(userId);
    }

    private LocalDate getLatestRestrictedDate(Donor donor) {
        if (donor == null) {
            return null;
        }

        LocalDate latestDate = donor.getLastDonationDate();
        List<Appointment> donorAppointments = donor.getUser() != null
                ? appointmentRepository.findByDonorUserId(donor.getUser().getId())
                : appointmentRepository.findByDonor_Id(donor.getId());

        LocalDate latestAppointmentDate = donorAppointments.stream()
                .filter(appointment -> appointment.getDate() != null)
                .filter(appointment -> !"Cancelled".equalsIgnoreCase(appointment.getStatus()))
                .map(Appointment::getDate)
                .max(Comparator.naturalOrder())
                .orElse(null);

        if (latestDate == null) {
            return latestAppointmentDate;
        }
        if (latestAppointmentDate == null) {
            return latestDate;
        }
        return latestAppointmentDate.isAfter(latestDate) ? latestAppointmentDate : latestDate;
    }
}
