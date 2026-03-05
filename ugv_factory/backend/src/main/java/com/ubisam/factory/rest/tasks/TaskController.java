package com.ubisam.factory.rest.tasks;

import com.ubisam.factory.domain.Task;
import com.ubisam.factory.domain.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskRepository taskRepository;
    private final TaskService taskService;

    @GetMapping
    public List<Task> list(@RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return taskRepository.findByStatusOrderByPriorityDescCreatedAtAsc(status);
        }
        return taskRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    public Task create(@RequestBody Map<String, Object> body) {
        Task task = Task.builder()
                .taskType((String) body.getOrDefault("task_type", "navigate"))
                .priority((Integer) body.getOrDefault("priority", 5))
                .robotId((String) body.getOrDefault("robot_id", "ugv01"))
                .status("queued")
                .payload((Map<String, Object>) body.get("payload"))
                .build();
        return taskRepository.save(task);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> get(@PathVariable Long id) {
        return taskRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Task> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return taskRepository.findById(id).map(task -> {
            if (body.containsKey("status")) task.setStatus((String) body.get("status"));
            if (body.containsKey("priority")) task.setPriority((Integer) body.get("priority"));
            return ResponseEntity.ok(taskRepository.save(task));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!taskRepository.existsById(id)) return ResponseEntity.notFound().build();
        taskRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/execute")
    public ResponseEntity<Task> execute(@PathVariable Long id) {
        return taskRepository.findById(id).map(task -> {
            taskService.executeTask(task);
            return ResponseEntity.ok(task);
        }).orElse(ResponseEntity.notFound().build());
    }
}
