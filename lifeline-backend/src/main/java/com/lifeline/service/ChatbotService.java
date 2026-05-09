package com.lifeline.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Locale;

@Service
public class ChatbotService {

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.1-8b-instant";
    private static final String SYSTEM_PROMPT = "You are the LifeLine Blood Donation Assistant. You help users understand blood types, donation eligibility (donors must wait 90 days between donations), and how to navigate the system. Keep answers short, friendly, and related to blood donation.";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.key}")
    private String groqApiKey;

    public ChatbotService(RestTemplateBuilder restTemplateBuilder, ObjectMapper objectMapper) {
        this.restTemplate = restTemplateBuilder.build();
        this.objectMapper = objectMapper;
    }

    public String getChatReply(String userMessage) {
        String normalizedMessage = userMessage == null ? "" : userMessage.trim();
        if (normalizedMessage.isBlank()) {
            return "Please enter a message so I can help.";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            Map<String, Object> payload = Map.of(
                    "model", MODEL,
                    "messages", List.of(
                            Map.of("role", "system", "content", SYSTEM_PROMPT),
                            Map.of("role", "user", "content", normalizedMessage)
                    ),
                    "temperature", 0.5
            );

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    GROQ_URL,
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            );

            return extractReply(response.getBody());
        } catch (HttpStatusCodeException ex) {
            return buildFallbackReply(normalizedMessage);
        } catch (ResourceAccessException ex) {
            return buildFallbackReply(normalizedMessage);
        } catch (Exception ex) {
            return buildFallbackReply(normalizedMessage);
        }
    }

    private String extractReply(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "I could not generate a response right now. Please try again.";
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
            if (!contentNode.isMissingNode() && !contentNode.asText().isBlank()) {
                return contentNode.asText().trim();
            }
        } catch (Exception ignored) {
            // Return fallback message below if parsing fails.
        }

        return "I could not generate a response right now. Please try again.";
    }

    private String extractErrorMessage(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "No error details returned by provider.";
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String message = root.path("error").path("message").asText("");
            if (!message.isBlank()) {
                return message;
            }
        } catch (Exception ignored) {
            // Fall through and return raw snippet.
        }

        String compact = responseBody.replaceAll("\\s+", " ").trim();
        return compact.length() > 200 ? compact.substring(0, 200) + "..." : compact;
    }

    private String buildFallbackReply(String userMessage) {
        String message = userMessage.toLowerCase(Locale.ROOT);

        if (containsAny(message, "hello", "hi", "hey")) {
            return "Hello! I can help with blood donation, eligibility, appointments, camps, and blood types.";
        }
        if (containsAny(message, "eligible", "eligibility", "can i donate", "am i eligible")) {
            return "Donors usually need to be healthy, meet the age and weight rules, and wait 90 days between donations. You can confirm eligibility in the donor booking flow.";
        }
        if (containsAny(message, "90 day", "wait", "how long", "donate again")) {
            return "You should usually wait 90 days between blood donations before booking again.";
        }
        if (containsAny(message, "blood type", "a+", "a-", "b+", "b-", "ab+", "ab-", "o+", "o-")) {
            return "Blood type compatibility matters for safe transfusions. O-negative is often used in emergencies, while AB-positive can receive from all blood types.";
        }
        if (containsAny(message, "appointment", "book", "booking")) {
            return "You can book a donation appointment from the donor portal. The system checks your eligibility during booking.";
        }
        if (containsAny(message, "camp", "camps")) {
            return "You can view upcoming donation camps in the Camps section and choose a nearby location.";
        }
        if (containsAny(message, "hospital", "emergency", "request")) {
            return "Hospitals can submit normal or critical blood requests. Critical requests go to the emergency queue, while normal ones go to the inventory management queue.";
        }
        if (containsAny(message, "login", "sign in", "nic", "password")) {
            return "You can sign in using your NIC number and password.";
        }

        return "I can help with donation eligibility, blood types, camps, appointments, emergency requests, and login guidance. Try asking a short question about one of those.";
    }

    private boolean containsAny(String message, String... keywords) {
        for (String keyword : keywords) {
            if (message.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
