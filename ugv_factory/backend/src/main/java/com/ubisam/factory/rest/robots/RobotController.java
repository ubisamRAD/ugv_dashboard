package com.ubisam.factory.rest.robots;

import com.ubisam.factory.domain.Robot;
import com.ubisam.factory.domain.RobotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/robots")
@RequiredArgsConstructor
public class RobotController {

    private final RobotRepository robotRepository;

    @GetMapping
    public List<Robot> list() {
        return robotRepository.findAll();
    }

    @GetMapping("/{id}")
    public Robot get(@PathVariable String id) {
        return robotRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Robot not found: " + id));
    }

    @PostMapping
    public Robot create(@RequestBody Robot robot) {
        return robotRepository.save(robot);
    }

    @PatchMapping("/{id}")
    public Robot update(@PathVariable String id, @RequestBody Map<String, Object> fields) {
        Robot robot = robotRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Robot not found: " + id));

        if (fields.containsKey("name")) robot.setName((String) fields.get("name"));
        if (fields.containsKey("bridgeUrl")) robot.setBridgeUrl((String) fields.get("bridgeUrl"));

        return robotRepository.save(robot);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        robotRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
