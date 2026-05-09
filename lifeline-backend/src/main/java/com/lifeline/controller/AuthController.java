package com.lifeline.controller;

import com.lifeline.model.Donor;
import com.lifeline.model.User;
import com.lifeline.repository.DonorRepository;
import com.lifeline.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {
    private static final String SESSION_USER_KEY = "lifeline_user";

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private DonorRepository donorRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload, HttpSession session) {
        String nicNo = normalizedValue(payload.get("nicNo"));
        String password = payload.get("password");

        if (nicNo.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "NIC No and password are required"));
        }

        return userRepository.findByNicNo(nicNo)
                .filter(user -> user.getPassword().equals(password))
                .<ResponseEntity<?>>map(user -> {
                    Map<String, Object> userData = Map.of(
                            "role", user.getRole().name(),
                            "userId", user.getId(),
                            "name", user.getName(),
                            "nicNo", user.getNicNo(),
                            "phoneNumber", user.getPhoneNumber()
                    );
                    session.setAttribute(SESSION_USER_KEY, userData);
                    return ResponseEntity.ok(userData);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid credentials")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload, HttpSession session) {
        String fullName = payload.get("fullName");
        String nicNo = normalizedValue(payload.get("nicNo"));
        String phoneNumber = normalizedValue(payload.get("phoneNumber"));
        String password = payload.get("password");
        String bloodType = payload.get("bloodType");

        if (fullName == null || fullName.isBlank() ||
                nicNo.isBlank() ||
                phoneNumber.isBlank() ||
                password == null || password.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Name, NIC No, phone number, and password are required"));
        }

        if (userRepository.findByNicNo(nicNo).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "NIC No is already registered"));
        }

        if (userRepository.findByPhoneNumber(phoneNumber).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Phone number is already registered"));
        }

        User user = new User();
        user.setName(fullName.trim());
        user.setNicNo(nicNo);
        user.setPhoneNumber(phoneNumber);
        user.setPassword(password);
        user.setRole(User.Role.DONOR);
        User savedUser = userRepository.save(user);

        Donor donor = new Donor();
        donor.setUser(savedUser);
        donor.setBloodType((bloodType != null && !bloodType.isBlank()) ? bloodType.trim() : "UNKNOWN");
        donor.setSafetyStatus("SAFE");
        donorRepository.save(donor);

        Map<String, Object> userData = Map.of(
                "role", savedUser.getRole().name(),
                "userId", savedUser.getId(),
                "name", savedUser.getName(),
                "nicNo", savedUser.getNicNo(),
                "phoneNumber", savedUser.getPhoneNumber()
        );
        session.setAttribute(SESSION_USER_KEY, userData);
        return ResponseEntity.status(HttpStatus.CREATED).body(userData);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Object sessionUser = session.getAttribute(SESSION_USER_KEY);
        if (sessionUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }
        return ResponseEntity.ok(sessionUser);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    private String normalizedValue(String value) {
        return value == null ? "" : value.trim();
    }
}
