package com.ubisam.factory.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "production_records")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "robot_id", nullable = false, length = 20)
    private String robotId;

    @Column(name = "period_start")
    private Instant periodStart;

    @Column(name = "period_end")
    private Instant periodEnd;

    @Column(name = "tasks_completed")
    @Builder.Default
    private Integer tasksCompleted = 0;

    @Column(name = "tasks_failed")
    @Builder.Default
    private Integer tasksFailed = 0;

    @Column(name = "total_distance")
    @Builder.Default
    private Double totalDistance = 0.0;

    @Column(name = "uptime_seconds")
    @Builder.Default
    private Long uptimeSeconds = 0L;

    @Column(name = "avg_battery")
    private Double avgBattery;
}
