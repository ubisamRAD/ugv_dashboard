package com.ubisam.factory.rest.robots;

import com.ubisam.factory.domain.Robot;
import com.ubisam.factory.domain.RobotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class RobotHealthService {

    private final RobotRepository robotRepository;
    private final RestTemplate restTemplate;

    @Scheduled(fixedDelay = 15000)
    public void checkHealth() {
        for (Robot robot : robotRepository.findAll()) {
            try {
                restTemplate.getForEntity(robot.getBridgeUrl() + "/api/health", String.class);
                robot.setStatus("online");
                robot.setLastSeenAt(Instant.now());
            } catch (Exception e) {
                robot.setStatus("offline");
            }
            robotRepository.save(robot);
        }
    }
}
