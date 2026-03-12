INSERT INTO robots (id, name, bridge_url, status, created_at)
VALUES ('ugv01', 'UGV-01', 'http://192.168.0.71:8081', 'unknown', NOW())
ON CONFLICT (id) DO NOTHING;
