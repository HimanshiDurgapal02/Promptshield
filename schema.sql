CREATE DATABASE IF NOT EXISTS promptshield;
USE promptshield;

CREATE TABLE IF NOT EXISTS scan_runs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  mode          ENUM('weak','defended') NOT NULL,
  score         DECIMAL(5,1) NOT NULL,
  total_attacks INT NOT NULL,
  leaked_count  INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attack_results (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  run_id    INT NOT NULL,
  attack_id VARCHAR(20),
  category  VARCHAR(40),
  name      VARCHAR(100),
  prompt    TEXT,
  response  TEXT,
  leaked    BOOLEAN,
  layer     VARCHAR(20),
  FOREIGN KEY (run_id) REFERENCES scan_runs(id) ON DELETE CASCADE
);
