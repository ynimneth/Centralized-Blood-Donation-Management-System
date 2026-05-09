package com.lifeline.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class HealthHistorySchemaMigration implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            ensureUserColumnExists();
            backfillUserIdFromDonorId();
            ensureUserForeignKey();
            dropLegacyDonorColumn();
        } catch (Exception ignored) {
            // Ignore migration errors to avoid blocking startup.
        }
    }

    private void ensureUserColumnExists() {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns " +
                        "WHERE table_schema = DATABASE() " +
                        "AND table_name = 'health_histories' " +
                        "AND column_name = 'user_id'",
                Integer.class
        );

        if (count != null && count == 0) {
            jdbcTemplate.execute("ALTER TABLE health_histories ADD COLUMN user_id BIGINT NULL");
        }
    }

    private void backfillUserIdFromDonorId() {
        Integer donorColumnCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns " +
                        "WHERE table_schema = DATABASE() " +
                        "AND table_name = 'health_histories' " +
                        "AND column_name = 'donor_id'",
                Integer.class
        );

        if (donorColumnCount != null && donorColumnCount > 0) {
            jdbcTemplate.execute(
                    "UPDATE health_histories hh " +
                            "JOIN donors d ON hh.donor_id = d.id " +
                            "SET hh.user_id = d.user_id " +
                            "WHERE hh.user_id IS NULL"
            );
        }
    }

    private void ensureUserForeignKey() {
        Integer fkCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.key_column_usage " +
                        "WHERE table_schema = DATABASE() " +
                        "AND table_name = 'health_histories' " +
                        "AND column_name = 'user_id' " +
                        "AND referenced_table_name = 'users'",
                Integer.class
        );

        if (fkCount != null && fkCount == 0) {
            jdbcTemplate.execute(
                    "ALTER TABLE health_histories " +
                            "ADD CONSTRAINT fk_health_histories_user " +
                            "FOREIGN KEY (user_id) REFERENCES users(id)"
            );
        }
    }

    private void dropLegacyDonorColumn() {
        Integer donorColumnCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns " +
                        "WHERE table_schema = DATABASE() " +
                        "AND table_name = 'health_histories' " +
                        "AND column_name = 'donor_id'",
                Integer.class
        );

        if (donorColumnCount == null || donorColumnCount == 0) {
            return;
        }

        List<String> fkNames = jdbcTemplate.queryForList(
                "SELECT constraint_name FROM information_schema.key_column_usage " +
                        "WHERE table_schema = DATABASE() " +
                        "AND table_name = 'health_histories' " +
                        "AND column_name = 'donor_id' " +
                        "AND referenced_table_name IS NOT NULL",
                String.class
        );

        for (String fkName : fkNames) {
            jdbcTemplate.execute("ALTER TABLE health_histories DROP FOREIGN KEY " + fkName);
        }

        jdbcTemplate.execute("ALTER TABLE health_histories DROP COLUMN donor_id");
    }
}
