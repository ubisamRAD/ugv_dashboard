package com.ubisam.factory.rest.alarms;

import com.ubisam.factory.domain.*;
import com.ubisam.factory.stomp.AlarmPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlarmService {

    private final AlarmRepository alarmRepository;
    private final AlarmDefinitionRepository definitionRepository;
    private final AlarmPublisher alarmPublisher;

    private final Map<String, Double> metrics = new ConcurrentHashMap<>();
    private final Map<Long, Instant> cooldowns = new ConcurrentHashMap<>();

    public void updateMetric(String name, double value) {
        metrics.put(name, value);
    }

    public Optional<Alarm> acknowledge(Long id, String by) {
        return alarmRepository.findById(id).map(alarm -> {
            alarm.setAcknowledged(true);
            alarm.setAcknowledgedBy(by);
            alarm.setAcknowledgedAt(Instant.now());
            return alarmRepository.save(alarm);
        });
    }

    public Optional<Alarm> resolve(Long id) {
        return alarmRepository.findById(id).map(alarm -> {
            alarm.setActive(false);
            alarm.setResolvedAt(Instant.now());
            return alarmRepository.save(alarm);
        });
    }

    @Scheduled(fixedDelay = 5000)
    public void evaluateAlarms() {
        List<AlarmDefinition> definitions = definitionRepository.findByEnabledTrue();

        for (AlarmDefinition defn : definitions) {
            Double value = metrics.get(defn.getConditionMetric());
            if (value == null) continue;

            boolean triggered = switch (defn.getConditionOperator()) {
                case "<" -> value < defn.getConditionValue();
                case "<=" -> value <= defn.getConditionValue();
                case ">" -> value > defn.getConditionValue();
                case ">=" -> value >= defn.getConditionValue();
                default -> false;
            };

            if (!triggered) continue;

            // Cooldown check
            Instant lastTriggered = cooldowns.get(defn.getId());
            if (lastTriggered != null &&
                Instant.now().isBefore(lastTriggered.plusSeconds(defn.getCooldownSeconds()))) {
                continue;
            }

            String message = defn.getMessageTemplate() != null
                    ? defn.getMessageTemplate().replace("{value}", String.format("%.2f", value))
                    : defn.getName() + ": " + value;

            Alarm alarm = Alarm.builder()
                    .definitionId(defn.getId())
                    .severity(defn.getSeverity())
                    .message(message)
                    .build();

            alarmRepository.save(alarm);
            alarmPublisher.publish(alarm);
            cooldowns.put(defn.getId(), Instant.now());

            log.info("Alarm triggered: {} = {} ({})", defn.getConditionMetric(), value, defn.getSeverity());
        }
    }
}
