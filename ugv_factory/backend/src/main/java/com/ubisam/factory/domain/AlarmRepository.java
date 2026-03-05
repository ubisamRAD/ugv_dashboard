package com.ubisam.factory.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlarmRepository extends JpaRepository<Alarm, Long> {

    List<Alarm> findByActiveTrueOrderByTriggeredAtDesc();

    List<Alarm> findTop100ByOrderByTriggeredAtDesc();
}
