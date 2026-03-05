package com.ubisam.factory.rest.alarms;

import com.ubisam.factory.domain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alarms")
@RequiredArgsConstructor
public class AlarmController {

    private final AlarmRepository alarmRepository;
    private final AlarmDefinitionRepository definitionRepository;
    private final AlarmService alarmService;

    @GetMapping("/active")
    public List<Alarm> active() {
        return alarmRepository.findByActiveTrueOrderByTriggeredAtDesc();
    }

    @GetMapping("/history")
    public List<Alarm> history() {
        return alarmRepository.findTop100ByOrderByTriggeredAtDesc();
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<Alarm> acknowledge(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        return alarmService.acknowledge(id, body != null ? body.get("acknowledged_by") : null)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<Alarm> resolve(@PathVariable Long id) {
        return alarmService.resolve(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/definitions")
    public List<AlarmDefinition> definitions() {
        return definitionRepository.findAll();
    }

    @PostMapping("/definitions")
    public AlarmDefinition createDefinition(@RequestBody AlarmDefinition defn) {
        return definitionRepository.save(defn);
    }

    @DeleteMapping("/definitions/{id}")
    public ResponseEntity<Void> deleteDefinition(@PathVariable Long id) {
        if (!definitionRepository.existsById(id)) return ResponseEntity.notFound().build();
        definitionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
