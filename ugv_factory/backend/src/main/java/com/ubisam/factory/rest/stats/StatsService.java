package com.ubisam.factory.rest.stats;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.InfluxDBClientFactory;
import com.influxdb.client.QueryApi;
import com.influxdb.query.FluxRecord;
import com.influxdb.query.FluxTable;
import com.ubisam.factory.domain.TaskRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatsService {

    private final TaskRepository taskRepository;

    @Value("${influxdb.url:http://localhost:8086}")
    private String influxUrl;

    @Value("${influxdb.token:}")
    private String influxToken;

    @Value("${influxdb.org:ubisam}")
    private String influxOrg;

    @Value("${influxdb.bucket:ugv}")
    private String influxBucket;

    private InfluxDBClient influxClient;

    @PostConstruct
    public void init() {
        if (influxToken != null && !influxToken.isBlank()) {
            influxClient = InfluxDBClientFactory.create(influxUrl, influxToken.toCharArray(), influxOrg, influxBucket);
        }
    }

    public Map<String, Object> getSummary(String period) {
        long total = taskRepository.count();
        long succeeded = taskRepository.findByStatusOrderByPriorityDescCreatedAtAsc("succeeded").size();
        long failed = taskRepository.findByStatusOrderByPriorityDescCreatedAtAsc("failed").size();
        double rate = total > 0 ? (double) succeeded / (succeeded + failed) * 100 : 0;

        Map<String, Object> result = new HashMap<>();
        result.put("tasks_completed", succeeded);
        result.put("tasks_failed", failed);
        result.put("success_rate", Math.round(rate));
        result.put("total_distance", 0.0);
        result.put("uptime_seconds", 0L);
        return result;
    }

    public List<Map<String, Object>> getTelemetry(String metric, String resolution, String period) {
        if (influxClient == null) return List.of();

        try {
            String flux = String.format(
                    "from(bucket: \"%s\") |> range(start: -%s) " +
                    "|> filter(fn: (r) => r[\"_measurement\"] == \"robot_telemetry\" and r[\"_field\"] == \"%s\") " +
                    "|> aggregateWindow(every: %s, fn: mean, createEmpty: false) " +
                    "|> yield(name: \"mean\")",
                    influxBucket, period, metric, resolution);

            QueryApi queryApi = influxClient.getQueryApi();
            List<FluxTable> tables = queryApi.query(flux);
            List<Map<String, Object>> points = new ArrayList<>();

            for (FluxTable table : tables) {
                for (FluxRecord record : table.getRecords()) {
                    Map<String, Object> point = new HashMap<>();
                    point.put("time", record.getTime() != null ? record.getTime().toString() : null);
                    point.put("value", record.getValue());
                    points.add(point);
                }
            }
            return points;
        } catch (Exception e) {
            log.error("InfluxDB query failed: {}", e.getMessage());
            return List.of();
        }
    }
}
