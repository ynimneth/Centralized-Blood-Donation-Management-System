package com.lifeline.config;

import com.lifeline.model.Camp;
import com.lifeline.model.Donor;
import com.lifeline.model.Hospital;
import com.lifeline.model.Inventory;
import com.lifeline.model.User;
import com.lifeline.repository.CampRepository;
import com.lifeline.repository.DonorRepository;
import com.lifeline.repository.HospitalRepository;
import com.lifeline.repository.InventoryRepository;
import com.lifeline.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
public class DataLoader implements CommandLineRunner {
    private static final List<String> BLOOD_TYPES = List.of("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-");
    private static final int DEFAULT_UNITS_PER_BLOOD_TYPE = 30;


    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private CampRepository campRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedUsersAndDonors();
        }
        if (inventoryRepository.count() == 0) {
            seedInventory();
        } else {
            ensureBaselineInventory();
        }
        if (campRepository.count() == 0) {
            seedCamps();
        }
        if (hospitalRepository.count() == 0) {
            seedHospitals();
        }
    }

    private void seedUsersAndDonors() {
        // Admin User
        User admin = new User();
        admin.setName("Admin Staff");
        admin.setNicNo("900000000V");
        admin.setPhoneNumber("0710000001");
        admin.setPassword("admin123"); // In real app, use BCrypt
        admin.setRole(User.Role.ADMIN);
        userRepository.save(admin);

        User hospital = new User();
        hospital.setName("Colombo National Hospital");
        hospital.setNicNo("900000001V");
        hospital.setPhoneNumber("0710000002");
        hospital.setPassword("hospital123");
        hospital.setRole(User.Role.HOSPITAL);
        userRepository.save(hospital);

        User lab = new User();
        lab.setName("Lab Technician");
        lab.setNicNo("900000002V");
        lab.setPhoneNumber("0710000003");
        lab.setPassword("lab123");
        lab.setRole(User.Role.LAB);
        userRepository.save(lab);

        // Donor 1: Eligible
        User user1 = new User();
        user1.setName("John Doe");
        user1.setNicNo("901234567V");
        user1.setPhoneNumber("0711234567");
        user1.setPassword("pass123");
        user1.setRole(User.Role.DONOR);
        userRepository.save(user1);
        Donor donor1 = new Donor(null, user1, "O+", LocalDate.of(2025, 1, 1), 70.0, "Male", LocalDate.of(1990, 5, 15), null, null);
        donorRepository.save(donor1);

        // Donor 2: Ineligible (Recent Donation)
        User user2 = new User();
        user2.setName("Jane Smith");
        user2.setNicNo("925678901V");
        user2.setPhoneNumber("0712345678");
        user2.setPassword("pass123");
        user2.setRole(User.Role.DONOR);
        userRepository.save(user2);
        Donor donor2 = new Donor(null, user2, "A-", LocalDate.now().minusDays(30), 60.0, "Female", LocalDate.of(1995, 8, 20), null, null);
        donorRepository.save(donor2);

        // Donor 3: New Donor
        User user3 = new User();
        user3.setName("Bob Brown");
        user3.setNicNo("881112223V");
        user3.setPhoneNumber("0713456789");
        user3.setPassword("pass123");
        user3.setRole(User.Role.DONOR);
        userRepository.save(user3);
        Donor donor3 = new Donor(null, user3, "AB+", null, 80.0, "Male", LocalDate.of(1985, 3, 10), null, null);
        donorRepository.save(donor3);

        System.out.println("Users and Donors seeded.");
    }

    private void seedInventory() {
        for (String bloodType : BLOOD_TYPES) {
            inventoryRepository.save(createBaselineInventory(bloodType));
        }

        // Bio-Hazard Bags
        inventoryRepository.save(new Inventory(null, "AB+", 1, LocalDate.now().plusDays(20), "DISCARD", "BIO-HAZARD", "TESTED_UNSAFE", null, null, null, null));
        inventoryRepository.save(new Inventory(null, "O-", 1, LocalDate.now().plusDays(15), "DISCARD", "BIO-HAZARD", "TESTED_UNSAFE", null, null, null, null));

        // Untested Bags
        inventoryRepository.save(new Inventory(null, "A-", 1, LocalDate.now().plusDays(35), "UNTESTED", null, "PENDING", null, null, null, null));

        System.out.println("Inventory seeded.");
    }

    private void ensureBaselineInventory() {
        for (String bloodType : BLOOD_TYPES) {
            Inventory baseline = inventoryRepository.findByBloodTypeIgnoreCase(bloodType).stream()
                    .filter(this::isUsableInventory)
                    .findFirst()
                    .orElseGet(() -> createBaselineInventory(bloodType));

            baseline.setBloodType(bloodType);
            baseline.setQuantity(DEFAULT_UNITS_PER_BLOOD_TYPE);
            baseline.setExpiryDate(LocalDate.now().plusDays(30));
            baseline.setStatus("AVAILABLE");
            baseline.setSafetyFlag("SAFE");
            baseline.setTestStatus("TESTED_SAFE");

            inventoryRepository.save(baseline);
        }

        System.out.println("Baseline inventory synchronized.");
    }

    private Inventory createBaselineInventory(String bloodType) {
        return new Inventory(null, bloodType, DEFAULT_UNITS_PER_BLOOD_TYPE, LocalDate.now().plusDays(30),
                "AVAILABLE", "SAFE", "TESTED_SAFE", null, null, null, null);
    }

    private boolean isUsableInventory(Inventory inventory) {
        String status = inventory.getStatus() == null ? "" : inventory.getStatus().trim().toUpperCase();
        String safetyFlag = inventory.getSafetyFlag() == null ? "" : inventory.getSafetyFlag().trim().toUpperCase();
        String testStatus = inventory.getTestStatus() == null ? "" : inventory.getTestStatus().trim().toUpperCase();

        return ("SAFE".equals(status) || "AVAILABLE".equals(status))
                && "SAFE".equals(safetyFlag)
                && "TESTED_SAFE".equals(testStatus);
    }

    private void seedCamps() {
        campRepository.save(new Camp(null, "Colombo Camp", "Western", "Colombo", "Colombo City Centre",
                LocalDate.of(2026, 3, 10), LocalTime.of(9, 0), LocalTime.of(13, 0), "Colombo National Hospital", "",
                6.9271, 79.8612, 0));
        campRepository.save(new Camp(null, "Kandy Drive", "Central", "Kandy", "Kandy City Center",
                LocalDate.of(2026, 3, 15), LocalTime.of(10, 30), LocalTime.of(14, 30), "Kandy General Hospital", "",
                7.2906, 80.6337, 0));
        campRepository.save(new Camp(null, "Galle Donation Event", "Southern", "Galle", "Galle Fort",
                LocalDate.of(2026, 3, 20), LocalTime.of(8, 30), LocalTime.of(12, 30), "Galle Teaching Hospital", "",
                6.0535, 80.2210, 0));

        System.out.println("Camps seeded.");
    }

    private void seedHospitals() {
        hospitalRepository.save(new Hospital(null, "Colombo National Hospital", "Western Province", "Colombo District",
                "Regent Street, Colombo", "011-2691111", null));
        hospitalRepository.save(new Hospital(null, "National Blood Center", "Western Province", "Colombo District",
                "Elvitigala Mawatha, Colombo", "011-5334400", null));
        hospitalRepository.save(new Hospital(null, "Ragama Teaching Hospital", "Western Province", "Gampaha District",
                "Ragama", "011-2958200", null));
        hospitalRepository.save(new Hospital(null, "Kandy General Hospital", "Central Province", "Kandy District",
                "William Gopallawa Mawatha, Kandy", "081-2233337", null));
        hospitalRepository.save(new Hospital(null, "Galle Teaching Hospital", "Southern Province", "Galle District",
                "Karapitiya, Galle", "091-2232561", null));
        hospitalRepository.save(new Hospital(null, "Jaffna Teaching Hospital", "Northern Province", "Jaffna District",
                "Hospital Road, Jaffna", "021-2222261", null));
        hospitalRepository.save(new Hospital(null, "Batticaloa Teaching Hospital", "Eastern Province", "Batticaloa District",
                "Batticaloa", "065-2222261", null));
        hospitalRepository.save(new Hospital(null, "Kurunegala Teaching Hospital", "North Western Province", "Kurunegala District",
                "Colombo Road, Kurunegala", "037-2222261", null));
        hospitalRepository.save(new Hospital(null, "Anuradhapura Teaching Hospital", "North Central Province", "Anuradhapura District",
                "Anuradhapura", "025-2222261", null));
        hospitalRepository.save(new Hospital(null, "Badulla Teaching Hospital", "Uva Province", "Badulla District",
                "Badulla", "055-2222261", null));
        hospitalRepository.save(new Hospital(null, "Ratnapura Teaching Hospital", "Sabaragamuwa Province", "Ratnapura District",
                "Ratnapura", "045-2222261", null));

        System.out.println("Hospitals seeded.");
    }
}
