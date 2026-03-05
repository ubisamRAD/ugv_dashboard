package com.ubisam.factory.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "alarm_definitions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AlarmDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(name = "condition_metric", nullable = false)
    private String conditionMetric;

    @Column(name = "condition_operator", nullable = false, length = 5)
    private String conditionOperator;

    @Column(name = "condition_value", nullable = false)
    private Double conditionValue;

    @Column(name = "message_template")
    private String messageTemplate;

    @Builder.Default
    private Boolean enabled = true;

    @Column(name = "cooldown_seconds")
    @Builder.Default
    private Integer cooldownSeconds = 60;
}
