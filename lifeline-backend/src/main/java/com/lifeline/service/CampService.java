package com.lifeline.service;

import com.lifeline.model.Camp;
import com.lifeline.repository.CampRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service // This class contains business logic for camp management
public class CampService {

    @Autowired // Inject repository object to access database
    private CampRepository campRepository;

    // Get all camps and add current status to each one
    public List<Map<String, Object>> getAllCamps() {
        List<Map<String, Object>> withStatus = new ArrayList<>();

        // Loop through all camps from database
        for (Camp camp : campRepository.findAll()) {
            // Convert camp and add status
            withStatus.add(enrichCamp(camp));
        }

        return withStatus;
    }

    // Find one camp by id and return it without status
    public Optional<Map<String, Object>> findCampById(int id) {
        return campRepository.findById((long) id).map(this::toCampMap);
    }

    // Find one camp by id and return it with status
    public Optional<Map<String, Object>> findCampByIdWithStatus(int id) {
        return campRepository.findById((long) id).map(this::enrichCamp);
    }

    // Create a new camp
    public Map<String, Object> createCamp(Map<String, Object> campData) {
        // Build camp object using given data and default values
        Camp camp = buildCampWithDefaults(campData);

        // Combine date and time to create full start date-time
        LocalDateTime start = LocalDateTime.of(camp.getDate(), camp.getStartTime());

        // Combine date and time to create full end date-time
        LocalDateTime end = LocalDateTime.of(camp.getDate(), camp.getEndTime());

        // Check whether end time is after start time
        if (!end.isAfter(start)) {
            throw new RuntimeException("Camp end time must be after start time.");
        }

        // Save new camp in database
        Camp saved = campRepository.save(camp);

        // Return saved camp with status
        return enrichCamp(saved);
    }

    // Update existing camp by id
    public Optional<Map<String, Object>> updateCamp(int id, Map<String, Object> campData) {
        // Check whether camp exists
        Optional<Camp> existingOpt = campRepository.findById((long) id);
        if (existingOpt.isEmpty()) {
            return Optional.empty();
        }

        // Get existing camp object
        Camp existing = existingOpt.get();

        // Update fields one by one
        existing.setName(getString(campData, "name"));
        existing.setLocation(getString(campData, "location"));
        existing.setDate(parseDate(campData.get("date"), existing.getDate()));
        existing.setStartTime(parseTime(campData.get("startTime"), existing.getStartTime()));
        existing.setEndTime(parseTime(campData.get("endTime"), existing.getEndTime()));
        existing.setInterestCount(parseInt(
                campData.get("interestCount"),
                existing.getInterestCount() == null ? 0 : existing.getInterestCount()
        ));
        existing.setLat(parseDouble(
                campData.get("lat"),
                existing.getLat() == null ? 6.9271 : existing.getLat()
        ));
        existing.setLng(parseDouble(
                campData.get("lng"),
                existing.getLng() == null ? 79.8612 : existing.getLng()
        ));
        existing.setProvince(getStringOrDefault(campData, "province", existing.getProvince()));
        existing.setDistrict(getStringOrDefault(campData, "district", existing.getDistrict()));
        existing.setNearestHospital(getStringOrDefault(campData, "nearestHospital", existing.getNearestHospital()));
        existing.setGoogleMapLink(getStringOrDefault(campData, "googleMapLink", existing.getGoogleMapLink()));

        // Create full start date-time from updated values
        LocalDateTime start = LocalDateTime.of(existing.getDate(), existing.getStartTime());

        // Create full end date-time from updated values
        LocalDateTime end = LocalDateTime.of(existing.getDate(), existing.getEndTime());

        // Check whether end time is after start time
        if (!end.isAfter(start)) {
            throw new RuntimeException("Camp end time must be after start time.");
        }

        // Save updated camp in database
        Camp saved = campRepository.save(existing);

        // Return updated camp with status
        return Optional.of(enrichCamp(saved));
    }

    // Delete camp by id
    public Optional<Map<String, Object>> deleteCamp(int id) {
        // Check whether camp exists
        Optional<Camp> campOpt = campRepository.findById((long) id);
        if (campOpt.isEmpty()) {
            return Optional.empty();
        }

        // Get camp object
        Camp camp = campOpt.get();

        // Delete camp from database
        campRepository.delete(camp);

        // Return deleted camp with status
        return Optional.of(enrichCamp(camp));
    }

    // Increase interest count when donor clicks interested
    public Optional<Map<String, Object>> registerInterest(int id) {
        // Check whether camp exists
        Optional<Camp> campOpt = campRepository.findById((long) id);
        if (campOpt.isEmpty()) {
            return Optional.empty();
        }

        // Get camp object
        Camp camp = campOpt.get();

        // Get current interest count, if null use 0
        int current = camp.getInterestCount() == null ? 0 : camp.getInterestCount();

        // Increase count by 1
        camp.setInterestCount(current + 1);

        // Save updated camp
        Camp saved = campRepository.save(camp);

        // Return updated camp with status
        return Optional.of(enrichCamp(saved));
    }

    // Get full starting date and time of a camp
    public LocalDateTime getCampStart(Map<String, Object> camp) {
        // Get date, if missing use today
        LocalDate date = parseDate(camp.get("date"), LocalDate.now());

        // Get start time from startTime or time, if missing use 09:00
        String startText = getNonEmptyString(
                camp.get("startTime"),
                camp.get("time"),
                "09:00"
        );

        // Convert string to LocalTime
        LocalTime start = parseTime(startText, LocalTime.of(9, 0));

        // Return full date-time
        return LocalDateTime.of(date, start);
    }

    // Get full ending date and time of a camp
    public LocalDateTime getCampEnd(Map<String, Object> camp) {
        // Get date, if missing use today
        LocalDate date = parseDate(camp.get("date"), LocalDate.now());

        // Get end time, if missing use 13:00
        String endText = getNonEmptyString(
                camp.get("endTime"),
                "13:00"
        );

        // Convert string to LocalTime
        LocalTime end = parseTime(endText, LocalTime.of(13, 0));

        // Return full date-time
        return LocalDateTime.of(date, end);
    }

    // Add extra details like current camp status
    private Map<String, Object> enrichCamp(Camp camp) {
        // Convert camp object into map
        Map<String, Object> copy = toCampMap(camp);

        // Get start and end time of this camp
        LocalDateTime start = getCampStart(copy);
        LocalDateTime end = getCampEnd(copy);

        // Get current system time
        LocalDateTime now = LocalDateTime.now();

        String status;

        // If current time is before start, camp is upcoming
        if (now.isBefore(start)) {
            status = "UPCOMING";
        }
        // If current time is after end, camp is ended
        else if (now.isAfter(end)) {
            status = "ENDED";
        }
        // Otherwise camp is ongoing
        else {
            status = "ONGOING";
        }

        // Add calculated status to response
        copy.put("campStatus", status);

        // If time field is missing, use startTime as time
        if (copy.get("time") == null) {
            copy.put("time", copy.get("startTime") != null ? copy.get("startTime") : "09:00");
        }

        return copy;
    }

    // Convert Camp entity object into map format
    private Map<String, Object> toCampMap(Camp camp) {
        Map<String, Object> campMap = new HashMap<>();

        // Put all camp values into map
        campMap.put("id", camp.getId());
        campMap.put("name", camp.getName());
        campMap.put("province", camp.getProvince());
        campMap.put("district", camp.getDistrict());
        campMap.put("location", camp.getLocation());
        campMap.put("date", camp.getDate() != null ? camp.getDate().toString() : null);
        campMap.put("startTime", camp.getStartTime() != null ? camp.getStartTime().toString() : null);
        campMap.put("endTime", camp.getEndTime() != null ? camp.getEndTime().toString() : null);
        campMap.put("nearestHospital", camp.getNearestHospital());
        campMap.put("googleMapLink", camp.getGoogleMapLink());
        campMap.put("lat", camp.getLat());
        campMap.put("lng", camp.getLng());
        campMap.put("interestCount", camp.getInterestCount() == null ? 0 : camp.getInterestCount());

        return campMap;
    }

    // Build a new Camp object and set default values if data is missing
    private Camp buildCampWithDefaults(Map<String, Object> campData) {
        Camp camp = new Camp();

        // Set basic camp values
        camp.setName(getString(campData, "name"));
        camp.setLocation(getString(campData, "location"));

        // Set date and time, if missing use default values
        camp.setDate(parseDate(campData.get("date"), LocalDate.now().plusDays(1)));
        camp.setStartTime(parseTime(campData.get("startTime"), LocalTime.of(9, 0)));
        camp.setEndTime(parseTime(campData.get("endTime"), LocalTime.of(13, 0)));

        // Set interest count, if missing use 0
        camp.setInterestCount(parseInt(campData.get("interestCount"), 0));

        // Set default latitude and longitude if missing
        camp.setLat(parseDouble(campData.get("lat"), 6.9271));
        camp.setLng(parseDouble(campData.get("lng"), 79.8612));

        // Set default province, district and hospital if missing
        camp.setProvince(getStringOrDefault(campData, "province", "Western"));
        camp.setDistrict(getStringOrDefault(campData, "district", "Colombo"));
        camp.setNearestHospital(getStringOrDefault(campData, "nearestHospital", ""));

        // Set Google map link if available
        camp.setGoogleMapLink(getStringOrDefault(campData, "googleMapLink", ""));

        return camp;
    }

    // Get value from map and convert it into string
    private String getString(Map<String, Object> source, String key) {
        Object value = source.get(key);
        return value == null ? null : String.valueOf(value);
    }

    // Get string value, if empty return fallback value
    private String getStringOrDefault(Map<String, Object> source, String key, String fallback) {
        String value = getString(source, key);
        return (value == null || value.isBlank()) ? fallback : value;
    }

    // Return first non-empty value from given list
    private String getNonEmptyString(Object... values) {
        for (Object value : values) {
            if (value == null) continue;

            String text = String.valueOf(value).trim();

            if (!text.isEmpty() && !"null".equalsIgnoreCase(text)) {
                return text;
            }
        }
        return null;
    }

    // Convert object value into LocalDate, if invalid use fallback
    private LocalDate parseDate(Object value, LocalDate fallback) {
        if (value == null) {
            return fallback;
        }

        String text = String.valueOf(value).trim();

        if (text.isEmpty() || "null".equalsIgnoreCase(text)) {
            return fallback;
        }

        return LocalDate.parse(text);
    }

    // Convert object value into LocalTime, if invalid use fallback
    private LocalTime parseTime(Object value, LocalTime fallback) {
        if (value == null) {
            return fallback;
        }

        String text = String.valueOf(value).trim();

        if (text.isEmpty() || "null".equalsIgnoreCase(text)) {
            return fallback;
        }

        return LocalTime.parse(text);
    }

    // Convert object value into integer, if empty use fallback
    private int parseInt(Object value, int fallback) {
        if (value == null || String.valueOf(value).trim().isEmpty()) {
            return fallback;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    // Convert object value into double, if empty use fallback
    private double parseDouble(Object value, double fallback) {
        if (value == null || String.valueOf(value).trim().isEmpty()) {
            return fallback;
        }
        return Double.parseDouble(String.valueOf(value));
    }
}