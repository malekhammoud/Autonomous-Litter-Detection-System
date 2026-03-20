-- Schema for Drone Litter Detection System

CREATE TABLE IF NOT EXISTS litter_locations (
  id SERIAL PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'picked_up')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  picked_up_at TIMESTAMP
);

-- Index for faster spatial queries (optional but good for future)
CREATE INDEX idx_litter_status ON litter_locations(status);
