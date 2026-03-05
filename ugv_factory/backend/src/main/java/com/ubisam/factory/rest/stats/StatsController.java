package com.ubisam.factory.rest.stats;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/summary")
    public Map<String, Object> summary(@RequestParam(defaultValue = "24h") String period) {
        return statsService.getSummary(period);
    }

    @GetMapping("/telemetry")
    public List<Map<String, Object>> telemetry(
            @RequestParam(defaultValue = "battery") String metric,
            @RequestParam(defaultValue = "1m") String resolution,
            @RequestParam(defaultValue = "1h") String period) {
        return statsService.getTelemetry(metric, resolution, period);
    }
}
