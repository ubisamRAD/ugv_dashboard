package com.ubisam.factory.rest.robots;

import com.ubisam.factory.domain.Robot;
import com.ubisam.factory.domain.RobotRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Enumeration;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class RobotProxyController {

    private final RobotRepository robotRepository;
    private final RestTemplate restTemplate;

    @RequestMapping(value = "/api/robots/{robotId}/{action}/**",
            method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
    public ResponseEntity<byte[]> proxy(
            @PathVariable String robotId,
            @PathVariable String action,
            HttpServletRequest request,
            @RequestBody(required = false) byte[] body) {

        Robot robot = robotRepository.findById(robotId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Robot not found: " + robotId));

        // /api/robots/ugv01/arm → /api/ugv01/arm
        String fullPath = request.getRequestURI();
        String proxyPath = fullPath.replaceFirst("/api/robots/" + robotId, "/api/" + robotId);
        String targetUrl = robot.getBridgeUrl() + proxyPath;

        String queryString = request.getQueryString();
        if (queryString != null) {
            targetUrl += "?" + queryString;
        }

        HttpHeaders headers = new HttpHeaders();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            if (!name.equalsIgnoreCase("host") && !name.equalsIgnoreCase("connection")) {
                headers.set(name, request.getHeader(name));
            }
        }

        HttpEntity<byte[]> entity = new HttpEntity<>(body, headers);
        HttpMethod method = HttpMethod.valueOf(request.getMethod());

        log.debug("Proxy {} {} → {}", method, fullPath, targetUrl);

        return restTemplate.exchange(targetUrl, method, entity, byte[].class);
    }

    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<Map<String, String>> handleBridgeTimeout(ResourceAccessException e) {
        log.error("Bridge unreachable: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("error", "bridge_unreachable", "message", e.getMessage()));
    }
}
