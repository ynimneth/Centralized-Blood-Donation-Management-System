package com.lifeline.controller;

import com.lifeline.service.CampService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/camps")
@CrossOrigin(origins = "http://localhost:5173")
public class CampController {

    @Autowired
    private CampService campService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getCamps() {
        return ResponseEntity.ok(campService.getAllCamps());
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createCamp(@RequestBody Map<String, Object> campData) {
        try {
            return ResponseEntity.ok(campService.createCamp(campData));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCamp(@PathVariable int id, @RequestBody Map<String, Object> campData) {
        try {
            return campService.updateCamp(id, campData)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteCamp(@PathVariable int id) {
        return campService.deleteCamp(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/interest")
    public ResponseEntity<Map<String, Object>> registerInterest(@PathVariable int id) {
        return campService.registerInterest(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
