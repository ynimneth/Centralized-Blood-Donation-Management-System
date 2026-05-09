package com.lifeline.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class RoleColumnMigration implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            // Ensure role can store any configured enum value (e.g. LAB) without MySQL enum truncation.
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(24) NOT NULL");
        } catch (Exception ignored) {
            // Ignore to avoid blocking app boot if schema is already compatible.
        }
    }
}
