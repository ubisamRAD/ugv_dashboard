package com.ubisam.factory.stomp;

import com.ubisam.factory.domain.Task;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class TaskStatusPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publish(Task task) {
        String destination = "/topic/factory." + task.getRobotId() + ".task_status";
        messagingTemplate.convertAndSend(destination, Map.of(
                "id", task.getId(),
                "status", task.getStatus(),
                "task_type", task.getTaskType(),
                "priority", task.getPriority()
        ));
    }
}
