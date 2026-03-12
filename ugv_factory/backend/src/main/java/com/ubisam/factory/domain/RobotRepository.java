package com.ubisam.factory.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RobotRepository extends JpaRepository<Robot, String> {
    List<Robot> findByStatus(String status);
}
