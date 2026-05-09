package com.lifeline.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "donor_id")
    private Donor donor;

    private Long donorUserId;
    private String donorName;

    private Long hospitalId; // Assuming Hospital is another entity or user role ID
    private String centerType; // HOSPITAL or CAMP
    private String centerName;
    
    private LocalDate date;
    private LocalTime time;
    
    private String status; // Scheduled, Completed, Cancelled
}
