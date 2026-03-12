package com.ubisam.factory.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "robots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Robot {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "bridge_url", nullable = false)
    private String bridgeUrl;

    @Column(length = 20)
    @Builder.Default
    private String status = "unknown";

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
