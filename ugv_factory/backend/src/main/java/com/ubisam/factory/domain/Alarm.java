package com.ubisam.factory.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "alarms")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Alarm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "definition_id")
    private Long definitionId;

    @Column(name = "robot_id", nullable = false, length = 20)
    @Builder.Default
    private String robotId = "ugv01";

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(nullable = false)
    private String message;

    @Builder.Default
    private Boolean active = true;

    @Builder.Default
    private Boolean acknowledged = false;

    @Column(name = "acknowledged_by")
    private String acknowledgedBy;

    @Column(name = "triggered_at")
    @Builder.Default
    private Instant triggeredAt = Instant.now();

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
