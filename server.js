const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parser middleware
app.use(express.json());

// Serve static frontend assets from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// --- REST API ENDPOINTS ---

// GET /api/patients - Get all registered patient profiles
app.get('/api/patients', (req, res) => {
  db.all('SELECT * FROM patients ORDER BY name ASC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching patients:', err);
      return res.status(500).json({ error: 'Failed to retrieve patient files.' });
    }
    res.json(rows);
  });
});

// POST /api/patients - Register a new patient profile
app.post('/api/patients', (req, res) => {
  const { name, age, gender, notes } = req.body;

  if (!name || !age || !gender) {
    return res.status(400).json({ error: 'Name, age, and gender are required parameters.' });
  }

  const createdAt = new Date().toISOString();

  db.run(
    'INSERT INTO patients (name, age, gender, notes, created_at) VALUES (?, ?, ?, ?, ?)',
    [name, parseInt(age), gender, notes || '', createdAt],
    function(err) {
      if (err) {
        console.error('Error creating patient:', err);
        return res.status(500).json({ error: 'Failed to create patient profile.' });
      }

      res.status(201).json({
        id: this.lastID,
        name,
        age: parseInt(age),
        gender,
        notes: notes || '',
        created_at: createdAt
      });
    }
  );
});

// DELETE /api/patients/:id - Delete a patient profile and associated session history
app.delete('/api/patients/:id', (req, res) => {
  const patientId = parseInt(req.params.id);

  if (isNaN(patientId)) {
    return res.status(400).json({ error: 'Invalid patient ID format.' });
  }

  // PRAGMA foreign_keys is ON, so deleting a patient will automatically cascade-delete all diagnostics
  db.run('DELETE FROM patients WHERE id = ?', [patientId], function(err) {
    if (err) {
      console.error('Error deleting patient:', err);
      return res.status(500).json({ error: 'Failed to delete patient profile.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Patient file not found.' });
    }

    res.json({ message: 'Patient profile and all diagnostic charts successfully deleted.' });
  });
});

// GET /api/patients/:id/history - Get the complete diagnostics history of a patient
app.get('/api/patients/:id/history', (req, res) => {
  const patientId = parseInt(req.params.id);

  if (isNaN(patientId)) {
    return res.status(400).json({ error: 'Invalid patient ID format.' });
  }

  db.all(
    'SELECT * FROM diagnoses WHERE patient_id = ? ORDER BY date DESC',
    [patientId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching patient history:', err);
        return res.status(500).json({ error: 'Failed to retrieve diagnostics timeline.' });
      }
      res.json(rows);
    }
  );
});

// POST /api/diagnoses - Save a new clinical diagnostics session snapshot
app.post('/api/diagnoses', (req, res) => {
  const {
    patient_id,
    heel,
    inner_ball,
    outer_ball,
    arch,
    arch_ratio,
    classification
  } = req.body;

  if (
    patient_id === undefined ||
    heel === undefined ||
    inner_ball === undefined ||
    outer_ball === undefined ||
    arch === undefined ||
    arch_ratio === undefined ||
    !classification
  ) {
    return res.status(400).json({ error: 'Missing required diagnostics fields.' });
  }

  const sessionDate = new Date().toISOString();

  db.run(
    'INSERT INTO diagnoses (patient_id, date, heel, inner_ball, outer_ball, arch, arch_ratio, classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      parseInt(patient_id),
      sessionDate,
      parseInt(heel),
      parseInt(inner_ball),
      parseInt(outer_ball),
      parseInt(arch),
      parseFloat(arch_ratio),
      classification
    ],
    function(err) {
      if (err) {
        console.error('Error saving diagnosis session:', err);
        return res.status(500).json({ error: 'Failed to save diagnostic session to database.' });
      }

      res.status(201).json({
        id: this.lastID,
        patient_id: parseInt(patient_id),
        date: sessionDate,
        heel: parseInt(heel),
        inner_ball: parseInt(inner_ball),
        outer_ball: parseInt(outer_ball),
        arch: parseInt(arch),
        arch_ratio: parseFloat(arch_ratio),
        classification
      });
    }
  );
});

// Serve index.html for all unrecognized frontend routes (single-page router support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start the local webserver
app.listen(PORT, () => {
  console.log(`=============================================================`);
  console.log(`🚀 STEP RIGHT diagnostics local server is live!`);
  console.log(`💻 Local host URL: http://localhost:${PORT}`);
  console.log(`📊 Connected to database at: ${path.join(__dirname, 'podo_diagnostics.db')}`);
  console.log(`=============================================================`);
});
