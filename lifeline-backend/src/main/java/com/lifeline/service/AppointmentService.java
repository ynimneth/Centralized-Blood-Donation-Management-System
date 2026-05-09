package com.lifeline.service;

import com.lifeline.model.Appointment;
import com.lifeline.model.Donor;
import com.lifeline.model.HealthHistory;
import com.lifeline.model.Inventory;
import com.lifeline.model.User;
import com.lifeline.repository.AppointmentRepository;
import com.lifeline.repository.DonorRepository;
import com.lifeline.repository.InventoryRepository;
import com.lifeline.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DonorService donorService;

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private CampService campService;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EligibilityService eligibilityService;

    public synchronized Appointment bookAppointment(Long donorId, Long hospitalId, LocalDateTime time, Long donorUserId, String donorName, String centerType, String bloodType, String centerName, HealthHistory questionnaire) {
        if (time.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Booking time must be in the future.");
        }

        Donor donor = resolveOrCreateDonor(donorId, donorUserId);
        
        // Update blood type if provided and currently unknown
        if (bloodType != null && !"UNKNOWN".equalsIgnoreCase(bloodType)) {
            if (donor.getBloodType() == null || "UNKNOWN".equalsIgnoreCase(donor.getBloodType())) {
                donor.setBloodType(bloodType);
                donorRepository.save(donor);
            }
        }

        if (questionnaire != null) {
            HealthHistory savedHistory = eligibilityService.submitHealthQuestionnaire(donor.getId(), questionnaire);
            if (!savedHistory.isEligible()) {
                throw new RuntimeException("You are not eligible to donate based on your health questionnaire answers.");
            }
        }

        // Check Eligibility after ensuring a donor record exists
        // Use the appointment date for checking eligibility
        boolean isEligible = donorService.isEligibleForDate(donor, time.toLocalDate());
        if (!isEligible) {
            Long eligibilityLookupId = donorUserId != null ? donorUserId : donor.getId();
            Map<String, Object> eligibilityDetails = donorService.getEligibilityDetails(eligibilityLookupId);
            String reason = eligibilityDetails.get("reason") != null
                    ? String.valueOf(eligibilityDetails.get("reason"))
                    : "You are not eligible to donate on this date. Please ensure there is at least a 90-day gap between bookings.";
            throw new RuntimeException(reason);
        }

        String normalizedCenterType = centerType == null ? "HOSPITAL" : centerType.trim().toUpperCase();
        String resolvedCenterName = centerName;
        
        if (resolvedCenterName == null || resolvedCenterName.isBlank()) {
            resolvedCenterName = normalizedCenterType.equals("CAMP")
                ? "Camp #" + hospitalId
                : "Hospital #" + hospitalId;
        }

        if ("CAMP".equals(normalizedCenterType)) {
            Optional<Map<String, Object>> campOpt = campService.findCampByIdWithStatus(hospitalId.intValue());
            if (campOpt.isEmpty()) {
                throw new RuntimeException("Selected camp was not found.");
            }
            Map<String, Object> camp = campOpt.get();
            LocalDateTime start = campService.getCampStart(camp);
            LocalDateTime end = campService.getCampEnd(camp);

            if (time.isBefore(start) || time.isAfter(end)) {
                throw new RuntimeException("Selected time is outside the camp schedule.");
            }

            resolvedCenterName = String.valueOf(camp.getOrDefault("name", resolvedCenterName));
        }

        List<Appointment> sameCenterDay = appointmentRepository.findByHospitalIdAndDate(hospitalId, time.toLocalDate());
        for (Appointment existing : sameCenterDay) {
            if ("Cancelled".equalsIgnoreCase(existing.getStatus())) {
                continue;
            }
            LocalDateTime existingTime = LocalDateTime.of(existing.getDate(), existing.getTime());
            long minutes = Math.abs(ChronoUnit.MINUTES.between(existingTime, time));
            if (minutes < 15) {
                throw new RuntimeException("This slot is already booked by "
                        + (existing.getDonorName() != null ? existing.getDonorName() : "another donor")
                        + ". Please pick a time at least 15 minutes apart.");
            }
        }

        // 3. Create Appointment
        Appointment appointment = new Appointment();
        appointment.setDonor(donor);
        appointment.setDonorUserId(donorUserId);
        appointment.setDonorName(donorName);
        appointment.setHospitalId(hospitalId);
        appointment.setCenterType(normalizedCenterType);
        appointment.setCenterName(resolvedCenterName);
        appointment.setDate(time.toLocalDate());
        appointment.setTime(time.toLocalTime());
        appointment.setStatus("Scheduled");

        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAppointmentsForDonor(Long donorId) {
        List<Appointment> byUserId = appointmentRepository.findByDonorUserId(donorId);
        if (byUserId != null && !byUserId.isEmpty()) {
            return byUserId;
        }
        return donorRepository.findByUser_Id(donorId)
                .map(donor -> appointmentRepository.findByDonor_Id(donor.getId()))
                .orElse(List.of());
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Appointment updateStatus(Long appointmentId, String status) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        String previousStatus = appointment.getStatus() == null ? "" : appointment.getStatus();
        appointment.setStatus(status);
        Appointment saved = appointmentRepository.save(appointment);

        if (!"Completed".equalsIgnoreCase(previousStatus) && "Completed".equalsIgnoreCase(status)) {
            createPendingLabBagForCompletedAppointment(saved);
            
            // Update last donation date only for Completed as it represents a finished donation event
            if (saved.getDonor() != null && saved.getDate() != null) {
                Donor donor = saved.getDonor();
                donor.setLastDonationDate(saved.getDate());
                donorRepository.save(donor);
            }
        }

        return saved;
    }

    private Donor resolveOrCreateDonor(Long donorId, Long donorUserId) {
        // Prioritize resolving by donorUserId (User ID) to ensure we get the correct record for the logged-in user
        // Use pessimistic lock to prevent concurrent booking race conditions
        if (donorUserId != null) {
            Optional<Donor> byUserId = donorRepository.findByUserIdWithLock(donorUserId);
            if (byUserId.isPresent()) {
                return byUserId.get();
            }

            // Create new donor if it doesn't exist for this user
            Donor donor = new Donor();
            Optional<User> userOpt = userRepository.findById(donorUserId);
            donor.setUser(userOpt.orElse(null));
            donor.setBloodType("UNKNOWN");
            return donorRepository.save(donor);
        }

        // Fallback to donorId if donorUserId is missing (legacy/unlikely)
        if (donorId != null) {
            Optional<Donor> byDonorId = donorRepository.findById(donorId);
            if (byDonorId.isPresent()) {
                return byDonorId.get();
            }
        }

        throw new RuntimeException("Donor not found. Please register first.");
    }

    private void createPendingLabBagForCompletedAppointment(Appointment appointment) {
        if (appointment.getId() == null) {
            return;
        }

        boolean alreadyCreated = inventoryRepository.findBySourceAppointmentId(appointment.getId()).isPresent();
        if (alreadyCreated) {
            return;
        }

        Inventory bag = new Inventory();
        bag.setBloodType(
                appointment.getDonor() != null && appointment.getDonor().getBloodType() != null
                        ? appointment.getDonor().getBloodType()
                        : "UNKNOWN"
        );
        bag.setQuantity(1);
        bag.setExpiryDate(appointment.getDate() != null ? appointment.getDate().plusDays(35) : null);
        bag.setStatus("UNTESTED");
        bag.setSafetyFlag(null);
        bag.setTestStatus("PENDING");
        bag.setDonorName(appointment.getDonorName());
        bag.setDonorUserId(appointment.getDonorUserId());
        bag.setCollectedAt(appointment.getDate() != null && appointment.getTime() != null
                ? LocalDateTime.of(appointment.getDate(), appointment.getTime())
                : LocalDateTime.now());
        bag.setSourceAppointmentId(appointment.getId());
        inventoryRepository.save(bag);
    }
}
