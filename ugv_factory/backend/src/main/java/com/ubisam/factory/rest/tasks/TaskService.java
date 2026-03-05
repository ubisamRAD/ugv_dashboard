package com.ubisam.factory.rest.tasks;

import com.ubisam.factory.domain.Task;
import com.ubisam.factory.domain.TaskRepository;
import com.ubisam.factory.stomp.TaskStatusPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskStatusPublisher taskStatusPublisher;

    @Value("${ugv.bridge.url:http://localhost:8081}")
    private String ugvBridgeUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public void executeTask(Task task) {
        task.setStatus("running");
        task.setStartedAt(Instant.now());
        taskRepository.save(task);
        taskStatusPublisher.publish(task);

        try {
            String endpoint = resolveEndpoint(task);
            Object payload = resolvePayload(task);

            if (endpoint != null) {
                restTemplate.postForEntity(ugvBridgeUrl + endpoint, payload, Map.class);
            }

            task.setStatus("succeeded");
            task.setCompletedAt(Instant.now());
        } catch (Exception e) {
            log.error("Task {} execution failed: {}", task.getId(), e.getMessage());
            task.setStatus("failed");
            task.setErrorMessage(e.getMessage());
            task.setCompletedAt(Instant.now());
        }

        taskRepository.save(task);
        taskStatusPublisher.publish(task);
    }

    private String resolveEndpoint(Task task) {
        String robotId = task.getRobotId();
        return switch (task.getTaskType()) {
            case "navigate" -> "/api/" + robotId + "/navigate";
            case "pick", "place" -> "/api/" + robotId + "/arm";
            default -> null;
        };
    }

    private Object resolvePayload(Task task) {
        Map<String, Object> payload = task.getPayload();
        if (payload == null) return Map.of();
        return switch (task.getTaskType()) {
            case "navigate" -> Map.of(
                    "x", payload.getOrDefault("x", 0),
                    "y", payload.getOrDefault("y", 0),
                    "theta", payload.getOrDefault("theta", 0)
            );
            case "pick", "place" -> Map.of(
                    "positions", payload.getOrDefault("positions", new int[]{0, 0, 0})
            );
            default -> payload;
        };
    }

    @Scheduled(fixedDelay = 5000)
    public void queueWorker() {
        taskRepository.findFirstByStatusOrderByPriorityDescCreatedAtAsc("queued")
                .ifPresent(this::executeTask);
    }
}
