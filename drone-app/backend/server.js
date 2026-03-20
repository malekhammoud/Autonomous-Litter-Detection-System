const path = require('path');
const envPath = path.resolve(__dirname, '.env');
require('dotenv').config({ path: envPath });

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

// Database Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(cors());
app.use(express.json());

app.post('/api/litter', async (req, res) => {
  const { latitude, longitude } = req.body;
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO litter_locations (latitude, longitude, status) VALUES ($1, $2, $3) RETURNING *',
      [latitude, longitude, 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/litter', async (req, res) => {
  const { status } = req.query;
  try {
    let query = 'SELECT * FROM litter_locations';
    let params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/litter/:id/pickup', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE litter_locations SET status = $1, picked_up_at = NOW() WHERE id = $2 RETURNING *',
      ['picked_up', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Litter not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Pickup error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Litter Detection API running on port ${port}`);
  console.log(`- Local:   http://localhost:${port}`);
  console.log(`- Network: http://<YOUR_IP_ADDRESS>:${port}`);
});
