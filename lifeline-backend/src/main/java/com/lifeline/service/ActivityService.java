package com.lifeline.service;

import com.lifeline.model.ActivityLog;
import com.lifeline.repository.ActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    public void logActivity(String description) {
        ActivityLog log = new ActivityLog(description);
        activityRepository.save(log);
    }
    
    public void logActivity(String description, String activityType) {
        ActivityLog log = new ActivityLog(description, activityType);
        activityRepository.save(log);
    }

    public List<ActivityLog> getRecentActivity() {
        return activityRepository.findTop10ByOrderByTimestampDesc();
    }
}
