const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, 'podo_diagnostics.db');
const db = new sqlite3.Database(DB_FILE);

// Enable foreign key constraints and create tables
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON;');

  // Create patients table
  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // Create diagnoses table
  db.run(`
    CREATE TABLE IF NOT EXISTS diagnoses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      heel INTEGER NOT NULL,
      inner_ball INTEGER NOT NULL,
      outer_ball INTEGER NOT NULL,
      arch INTEGER NOT NULL,
      arch_ratio REAL NOT NULL,
      classification TEXT NOT NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);

  // Seed default patient profiles if empty
  db.get('SELECT COUNT(*) AS count FROM patients', (err, row) => {
    if (err) {
      console.error('Error querying patients count:', err);
      return;
    }

    if (row.count === 0) {
      console.log('Seeding clinical patient profiles from high-fidelity mockup...');
      
      const tMinus30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const tMinus20 = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
      const tMinus15 = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
      const tMinus10 = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const tNow = new Date().toISOString();

      // 1. Seed Marcus Aurelius
      db.run(
        'INSERT INTO patients (name, age, gender, notes, created_at) VALUES (?, ?, ?, ?, ?)',
        ['Marcus Aurelius', 45, 'Male', 'Bilateral heel pain, severe flat feet, and tight calves. Under active monitoring with +4.2% arch improvement.', tMinus30],
        function(err) {
          if (err) return console.error(err);
          const pId = this.lastID;
          db.run('INSERT INTO diagnoses (patient_id, date, heel, inner_ball, outer_ball, arch, arch_ratio, classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [pId, tMinus30, 550, 480, 380, 620, 0.30, 'Severe Flat Foot']
          );
          db.run('INSERT INTO diagnoses (patient_id, date, heel, inner_ball, outer_ball, arch, arch_ratio, classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [pId, tMinus20, 560, 490, 400, 510, 0.26, 'Mild Flat Foot']
          );
          db.run('INSERT INTO diagnoses (patient_id, date, heel, inner_ball, outer_ball, arch, arch_ratio, classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [pId, tMinus10, 580, 460, 410, 400, 0.21, 'Mild Flat Foot']
          );
          db.run('INSERT INTO diagnoses (patient_id, date, heel, inner_ball, outer_ball, arch, arch_ratio, classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [pId, tNow, 600, 450, 420, 310, 0.17, 'Normal Arch']
          );
        }
      );

      // 2. Seed Elena Vance
      db.run(
        'INSERT INTO patients (name, age, gender, notes, created_at) VALUES (?, ?, ?, ?, ?)',
        ['Elena Vance', 29, 'Female', 'Recent severe flat foot collapse (-12.8% trend drop). Experiencing plantar stress. Requires urgent rehabilitation.', tMinus20],
        function(err) {
          if (err) return console.error(err);
          const pId = this.lastID;
          db.run('INSERT INTO diagnoses (patient_id, date, heel, inner_ball, outer_ball, arch, arch_ratio, classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [pId, tMinus20, 580, 450, 410, 310, 0.17, 'Normal Arch']
          );
          db.run('INSERT INTO diagnoses (patient_id, date, heel, inner_ball, outer_ball, arch, arch_ratio, classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [pId, tMinus10, 560, 480, 390, 450, 0.24, 'Mild Flat Foot']
          );
          db.run('INSERT INTO diagnoses (patient_id, date, heel, inner_ball, outer_ball, arch, arch_ratio, classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [pId, tNow, 550, 500, 380, 600, 0.295, 'Severe Flat Foot']
          );
        }
      );

      // 3. Seed Julian Casablancas
      db.run(
        'INSERT INTO patients (name, age, gender, notes, created_at) VALUES (?, ?, ?, ?, ?)',
        ['Julian Casablancas', 43, 'Male', 'Bilateral arch indicators are stable. Maintains excellent foot posture (+1.1% trend change). Scheduled for maintenance checkups.', tMinus15],
        function(err) {
          if (err) return console.error(err);
          const pId = this.lastID;
          db.run('INSERT INTO diagnoses (patient_id, date, heel, inner_ball, outer_ball, arch, arch_ratio, classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [pId, tMinus15, 610, 430, 400, 110, 0.07, 'Normal Arch']
          );
          db.run('INSERT INTO diagnoses (patient_id, date, heel, inner_ball, outer_ball, arch, arch_ratio, classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [pId, tNow, 600, 420, 415, 105, 0.068, 'Normal Arch']
          );
        }
      );

      // 4. Seed Ada Lovelace
      db.run(
        'INSERT INTO patients (name, age, gender, notes, created_at) VALUES (?, ?, ?, ?, ?)',
        ['Ada Lovelace', 36, 'Female', 'Strong intrinsic arch rehabilitation (+8.5% trend improvement). Complained of mild ankle stiffness.', tMinus30],
        function(err) {
          if (err) return console.error(err);
          const pId = this.lastID;
          db.run('INSERT INTO diagnoses (patient_id, date, heel, inner_ball, outer_ball, arch, arch_ratio, classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [pId, tMinus30, 570, 490, 400, 500, 0.255, 'Mild Flat Foot']
          );
          db.run('INSERT INTO diagnoses (patient_id, date, heel, inner_ball, outer_ball, arch, arch_ratio, classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [pId, tMinus20, 590, 460, 410, 420, 0.22, 'Mild Flat Foot']
          );
          db.run('INSERT INTO diagnoses (patient_id, date, heel, inner_ball, outer_ball, arch, arch_ratio, classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [pId, tMinus10, 600, 440, 415, 305, 0.173, 'Normal Arch']
          );
          db.run('INSERT INTO diagnoses (patient_id, date, heel, inner_ball, outer_ball, arch, arch_ratio, classification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [pId, tNow, 600, 435, 420, 205, 0.123, 'Normal Arch']
          );
        }
      );

      console.log('Seeded database successfully with Marcus, Elena, Julian, and Ada.');
    }
  });
});

module.exports = db;
