package com.ubisam.factory.stomp;

import com.ubisam.factory.domain.Alarm;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class AlarmPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publish(Alarm alarm) {
        String destination = "/topic/factory." + alarm.getRobotId() + ".alarm";
        messagingTemplate.convertAndSend(destination, Map.of(
                "id", alarm.getId(),
                "severity", alarm.getSeverity(),
                "message", alarm.getMessage(),
                "active", alarm.getActive(),
                "triggered_at", alarm.getTriggeredAt().toString()
        ));
    }
}
