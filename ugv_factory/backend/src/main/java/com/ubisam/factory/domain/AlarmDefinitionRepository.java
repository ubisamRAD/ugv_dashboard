package com.ubisam.factory.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlarmDefinitionRepository extends JpaRepository<AlarmDefinition, Long> {

    List<AlarmDefinition> findByEnabledTrue();
}
