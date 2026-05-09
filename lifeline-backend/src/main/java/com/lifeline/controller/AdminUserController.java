package com.lifeline.controller;

import com.lifeline.model.User;
import com.lifeline.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminUserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> listUsers(@RequestParam Long actingUserId) {
        try {
            ensureAdmin(actingUserId);
            List<User> users = userRepository.findAllByOrderByIdAsc();
            return ResponseEntity.ok(users.stream().map(this::sanitizeUser).toList());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> payload) {
        try {
            Long actingUserId = toLong(payload.get("actingUserId"));
            ensureAdmin(actingUserId);

            String name = stringValue(payload.get("name"));
            String nicNo = stringValue(payload.get("nicNo"));
            String phoneNumber = stringValue(payload.get("phoneNumber"));
            String password = stringValue(payload.get("password"));
            User.Role role = parseRole(payload.get("role"));

            if (name.isBlank() || nicNo.isBlank() || phoneNumber.isBlank() || password.isBlank()) {
                throw new RuntimeException("Name, NIC No, phone number, and password are required.");
            }
            if (userRepository.findByNicNo(nicNo).isPresent()) {
                throw new RuntimeException("NIC No is already registered.");
            }
            if (userRepository.findByPhoneNumber(phoneNumber).isPresent()) {
                throw new RuntimeException("Phone number is already registered.");
            }

            User user = new User();
            user.setName(name);
            user.setNicNo(nicNo);
            user.setPhoneNumber(phoneNumber);
            user.setPassword(password);
            user.setRole(role);
            User saved = userRepository.save(user);
            return ResponseEntity.ok(sanitizeUser(saved));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{userId}/role")
    public ResponseEntity<?> updateRole(@PathVariable Long userId, @RequestBody Map<String, Object> payload) {
        try {
            Long actingUserId = toLong(payload.get("actingUserId"));
            ensureAdmin(actingUserId);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Target user not found."));
            user.setRole(parseRole(payload.get("role")));
            User saved = userRepository.save(user);
            return ResponseEntity.ok(sanitizeUser(saved));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private void ensureAdmin(Long actingUserId) {
        if (actingUserId == null) {
            throw new RuntimeException("actingUserId is required.");
        }
        User actingUser = userRepository.findById(actingUserId)
                .orElseThrow(() -> new RuntimeException("Acting user not found."));
        if (actingUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Only admin users can manage credentials.");
        }
    }

    private User.Role parseRole(Object rawRole) {
        String roleText = stringValue(rawRole).toUpperCase();
        try {
            return User.Role.valueOf(roleText);
        } catch (Exception e) {
            throw new RuntimeException("Invalid role: " + roleText);
        }
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        return Long.valueOf(String.valueOf(value));
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private Map<String, Object> sanitizeUser(User user) {
        return Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "nicNo", user.getNicNo(),
                "phoneNumber", user.getPhoneNumber(),
                "role", user.getRole().name()
        );
    }
}
