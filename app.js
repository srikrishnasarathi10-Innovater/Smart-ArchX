// --- STATIC CLINICAL REHABILITATION DATA ---
const MOCK_EXERCISES = [
  {
    id: 1,
    name: 'Short Foot Arch Lifts',
    difficulty: 'Medium',
    target_area: 'Medial Arch Core Strength',
    description: 'Activates intrinsic foot muscles to structurally rebuild fallen arches.',
    youtube_url: 'https://youtu.be/Ghs2pxNV4VM',
    frequency: 'Daily: 3 sets of 12 reps'
  },
  {
    id: 2,
    name: 'Ankle & Midfoot Stabilization',
    difficulty: 'Medium',
    target_area: 'Tendon Support & Stabilization',
    description: 'Strengthens and stabilizes key ankle and midfoot supporting ligaments.',
    youtube_url: 'https://youtu.be/IoTJSTh-uig',
    frequency: 'Daily: 3 sets of 10 reps'
  },
  {
    id: 3,
    name: 'Fallen Arch Realignment',
    difficulty: 'Hard',
    target_area: 'Severe Flat Foot Correction',
    description: 'Clinical physical therapy routine to correct pronation and fallen arches.',
    youtube_url: 'https://youtu.be/wHTHJ1iXhew',
    frequency: 'Daily: 2 sets of 15 reps'
  },
  {
    id: 4,
    name: 'Calf & Fascia Mobility Release',
    difficulty: 'Easy',
    target_area: 'Calf Mobility & Heel Tension',
    description: 'Lengthens tight calf muscles and Achilles tendons to ease heel stress.',
    youtube_url: 'https://youtu.be/Ed0BjBEh5sE',
    frequency: 'Daily: 4 reps of 30 secs'
  },
  {
    id: 5,
    name: 'Intrinsic Toe Flexor Strength',
    difficulty: 'Medium',
    target_area: 'Foot Core Muscle Building',
    description: 'Builds underfoot muscular support to prevent flat foot progression.',
    youtube_url: 'https://youtu.be/Ghs2pxNV4VM',
    frequency: 'Daily: 3 sets of 10 reps'
  },
  {
    id: 6,
    name: 'Tibialis Posterior Loading',
    difficulty: 'Hard',
    target_area: 'Inner Ankle Line Pronation Control',
    description: 'Prevents inward ankle rolling by activating and loading the post-tib tendon.',
    youtube_url: 'https://youtu.be/IoTJSTh-uig',
    frequency: 'Daily: 3 sets of 12 reps'
  },
  {
    id: 7,
    name: 'Pronated Arch Posture Correction',
    difficulty: 'Medium',
    target_area: 'Posture & Alignment Correction',
    description: 'Exercises designed to structurally rebuild flat feet and ankle lines.',
    youtube_url: 'https://youtu.be/wHTHJ1iXhew',
    frequency: 'Daily: 3 sets of 10 reps'
  },
  {
    id: 8,
    name: 'Plantar Fascia Stretch',
    difficulty: 'Easy',
    target_area: 'Deep Sole Tissue Stretch',
    description: 'Alleviates direct arch and heel strain through focused calf elongation.',
    youtube_url: 'https://youtu.be/Ed0BjBEh5sE',
    frequency: 'Daily: 4 reps of 30 secs'
  }
];

// --- APPLICATION GLOBAL STATE ---
let currentTab = 'live';
let sensorData = { heel: 0, inner_ball: 0, outer_ball: 0, arch: 0 };
let serialConnected = false;
let isDemoMode = false;
let demoTimer = null;
let demoStance = 'normal';
let demoTimeIndex = 0;

let hasLoggedCurrentStance = false;
let standingCounter = 0;

let activePatientId = null;

let serialPort = null;
let serialReader = null;
let serialKeepReading = false;
let pumpRuntimeSec = 0;
let lastPumpRuntimeUpdate = Date.now();
let currentInflationLevels = [0, 0, 0, 0];

// --- DYNAMIC NOTIFICATION TOAST ENGINE ---
const showToastNotification = (message) => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = 'glass-panel px-5 py-3 border border-primary/20 bg-surface-container-low/95 text-on-surface shadow-xl rounded-lg flex items-center gap-3 transition-all duration-500 translate-y-10 opacity-0 pointer-events-auto max-w-sm border-l-4 border-l-primary';
  toast.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.4), 0 0 15px rgba(6, 182, 212, 0.1)';
  
  toast.innerHTML = `
    <span class="material-symbols-outlined text-primary text-xl animate-pulse">info</span>
    <span class="font-label-mono-sm text-xs tracking-wide leading-relaxed">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Trigger entry animation
  setTimeout(() => {
    toast.className = toast.className.replace('translate-y-10 opacity-0', 'translate-y-0 opacity-100');
  }, 10);
  
  // Dismiss after 4 seconds
  setTimeout(() => {
    toast.className = toast.className.replace('translate-y-0 opacity-100', 'translate-y-10 opacity-0');
    setTimeout(() => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    }, 500);
  }, 4000);
};

// --- STATIC MODE LOCAL STORAGE DATABASE SEEDING ---
const MOCK_PATIENTS_KEY = 'smrtflat_mock_patients';
const MOCK_HISTORY_KEY = 'smrtflat_mock_history';

const seedMockLocalStorage = () => {
  if (!localStorage.getItem(MOCK_PATIENTS_KEY)) {
    const defaultPatients = [
      { id: 1, name: "Marcus Aurelius", age: 44, gender: "Male", notes: "Fallen arches, calf tightness" },
      { id: 2, name: "Elena Rostova", age: 29, gender: "Female", notes: "Normal arch profile, marathon training" },
      { id: 3, name: "Julian Vance", age: 35, gender: "Male", notes: "Slight left foot pronation" },
      { id: 4, name: "Ada Lovelace", age: 31, gender: "Female", notes: "High rigid arches bilaterally" }
    ];
    localStorage.setItem(MOCK_PATIENTS_KEY, JSON.stringify(defaultPatients));
  }
  if (!localStorage.getItem(MOCK_HISTORY_KEY)) {
    const defaultHistory = [
      { id: 1, patient_id: 1, heel: 85, inner_ball: 90, outer_ball: 40, arch: 10, arch_ratio: 4.3, classification: "Flat Foot", time: new Date().toLocaleDateString() },
      { id: 2, patient_id: 2, heel: 50, inner_ball: 60, outer_ball: 55, arch: 40, arch_ratio: 1.5, classification: "Normal Stance", time: new Date().toLocaleDateString() }
    ];
    localStorage.setItem(MOCK_HISTORY_KEY, JSON.stringify(defaultHistory));
  }
};
seedMockLocalStorage();

// --- BACKEND API COMMUNICATIONS LAYER ---
const API = {
  isStaticMode: false,

  async getPatients() {
    try {
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('API query error');
      this.isStaticMode = false;
      return await response.json();
    } catch (err) {
      console.warn('API connection failed. Running in Local Storage Static Mode.', err);
      this.isStaticMode = true;
      const data = localStorage.getItem(MOCK_PATIENTS_KEY);
      return data ? JSON.parse(data) : [];
    }
  },

  async createPatient(name, age, gender, notes) {
    if (this.isStaticMode) {
      const patients = JSON.parse(localStorage.getItem(MOCK_PATIENTS_KEY) || '[]');
      const newPatient = {
        id: patients.length > 0 ? Math.max(...patients.map(p => p.id)) + 1 : 1,
        name,
        age: parseInt(age),
        gender,
        notes
      };
      patients.push(newPatient);
      localStorage.setItem(MOCK_PATIENTS_KEY, JSON.stringify(patients));
      return newPatient;
    }
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age: parseInt(age), gender, notes })
      });
      if (!response.ok) throw new Error('API save error');
      return await response.json();
    } catch (err) {
      console.error('Failed to create patient file:', err);
      return null;
    }
  },

  async deletePatient(id) {
    if (this.isStaticMode) {
      let patients = JSON.parse(localStorage.getItem(MOCK_PATIENTS_KEY) || '[]');
      patients = patients.filter(p => p.id !== parseInt(id));
      localStorage.setItem(MOCK_PATIENTS_KEY, JSON.stringify(patients));
      return { success: true };
    }
    try {
      const response = await fetch(`/api/patients/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('API delete error');
      return await response.json();
    } catch (err) {
      console.error(`Failed to delete patient profile ${id}:`, err);
      return null;
    }
  },

  async getPatientHistory(patientId) {
    if (this.isStaticMode) {
      const history = JSON.parse(localStorage.getItem(MOCK_HISTORY_KEY) || '[]');
      return history.filter(h => h.patient_id === parseInt(patientId));
    }
    try {
      const response = await fetch(`/api/patients/${patientId}/history`);
      if (!response.ok) throw new Error('API history query error');
      return await response.json();
    } catch (err) {
      console.error(`Failed to load diagnostics logs for patient ${patientId}:`, err);
      return [];
    }
  },

  async saveDiagnosis(patientId, heel, inner, outer, arch, ratio, classification) {
    if (this.isStaticMode) {
      const history = JSON.parse(localStorage.getItem(MOCK_HISTORY_KEY) || '[]');
      const newLog = {
        id: history.length > 0 ? Math.max(...history.map(h => h.id)) + 1 : 1,
        patient_id: parseInt(patientId),
        heel: parseInt(heel),
        inner_ball: parseInt(inner),
        outer_ball: parseInt(outer),
        arch: parseInt(arch),
        arch_ratio: parseFloat(ratio),
        classification,
        time: new Date().toLocaleString()
      };
      history.push(newLog);
      localStorage.setItem(MOCK_HISTORY_KEY, JSON.stringify(history));
      return newLog;
    }
    try {
      const response = await fetch('/api/diagnoses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: parseInt(patientId),
          heel: parseInt(heel),
          inner_ball: parseInt(inner),
          outer_ball: parseInt(outer),
          arch: parseInt(arch),
          arch_ratio: parseFloat(ratio),
          classification
        })
      });
      if (!response.ok) throw new Error('API diagnostic save error');
      return await response.json();
    } catch (err) {
      console.error('Failed to archive diagnostic session snapshot:', err);
      return null;
    }
  }
};

// --- SCIENTIFIC DIAGNOSTICS & PAIN SUGGESTIONS ENGINE ---
const getDiagnosis = (toe, ball, arch, heel) => {
  const total = toe + ball + arch + heel;
  
  if (total < 40) {
    return {
      title: 'STAND PATIENT UPRIGHT',
      classification: 'No Weight Bearing',
      color: 'rgba(0, 0, 0, 0)',
      accent: 'rgba(0, 0, 0, 0)',
      description: 'Stand firmly on the sensor insert with your full body weight to start scanning.',
      relief: [],
      link: 'rehab.html'
    };
  }

  // FSR is considered pressed if reading is > 15 (captures any light hand touch)
  const p1 = toe > 15;   // FSR 1 (Toe / Top)
  const p2 = ball > 15;  // FSR 2 (Ball)
  const p3 = arch > 15;  // FSR 3 (Arch)
  const p4 = heel > 15;  // FSR 4 (Heel)

  // 1. Top, Heel, Ball, and Arch are all pressed -> Flat Foot
  if (p1 && p2 && p3 && p4) {
    return {
      title: 'PES PLANUS - SEVERE FLAT FOOT',
      classification: 'Severe Flat Foot',
      color: '#f43f5e',
      accent: '#f43f5e',
      description: 'Severe flat foot. Complete collapse of the arch, causing inward ankle rolling.',
      relief: [
        'Foot Exercises: Spend 3 minutes daily on towel scrunches.',
        'Heel Raises: Calf raises keeping ankles aligned.',
        'Arch Supports: Custom orthotics to realign the ankles.',
        'Stability Shoes: Rigid midsoles to block inward ankle rolling.'
      ],
      link: 'rehab.html'
    };
  }

  // 2. Top, Heel, and Ball are pressed -> Normal Foot
  if (p1 && p2 && p4) {
    return {
      title: 'PES NORMALIS (NORMAL ARCH)',
      classification: 'Normal Arch',
      color: '#10b981',
      accent: '#10b981',
      description: 'Normal arch. Weight is distributed evenly across your feet.',
      relief: [
        'Neutral Footwear: Shoes with mild support.',
        'Ankle Mobility: Basic stretches to keep joints flexible.'
      ],
      link: 'rehab.html'
    };
  }

  // 3. Top and Heel are pressed -> High Arch
  if (p1 && p4) {
    return {
      title: 'PES CAVUS (HIGH ARCH)',
      classification: 'High Arch',
      color: '#f43f5e',
      accent: '#f43f5e',
      description: 'High arch. Standing load is concentrated heavily on the heel and outer sole edge.',
      relief: [
        'Massaging sole: Roll your arch on a tennis ball for 3 minutes daily.',
        'Calf Stretch: Wall stretches to improve ankle mobility.',
        'Cushioned Shoes: Thick midsoles to absorb walking shock.',
        'Arch Inserts: Orthotics to fill the arch space and distribute weight.'
      ],
      link: 'rehab.html'
    };
  }

  // Fallback: Default to High Arch / No weight (transparent) if any other combination occurs
  return {
    title: 'PES CAVUS (HIGH ARCH)',
    classification: 'High Arch',
    color: '#f43f5e',
    accent: '#f43f5e',
    description: 'High arch. Standing load is concentrated heavily on the heel and outer sole edge.',
    relief: [],
    link: 'rehab.html'
  };
};

// --- TELEMETRY COLOR HEATMAP ENGINE ---
const getPressureColor = (value, activeGlowColor) => {
  if (value > 15) {
    return activeGlowColor;
  }
  return 'rgba(0, 0, 0, 0)';
};

const getGlowRadius = (value, activeGlowColor) => {
  if (value > 15 && activeGlowColor !== 'rgba(0, 0, 0, 0)') {
    const pct = Math.min(1023, Math.max(0, value)) / 1023;
    return 24 + pct * 18;
  }
  return 0;
};

const getGlowBlur = (value, activeGlowColor) => {
  if (value > 15 && activeGlowColor !== 'rgba(0, 0, 0, 0)') {
    const pct = Math.min(1023, Math.max(0, value)) / 1023;
    return 8 + pct * 14;
  }
  return 0;
};



// --- PROTOTYPE HARDWARE SIMULATION UI ENGINE ---
const updateHardwareSimulationUI = (toeVal, ballVal, archVal, heelVal, totalPress, diag, activeGlowColor) => {
  // Pressure Threshold for High Activation is 350
  const highThreshold = 350;
  
  // 1. Pump Simulation Module
  let pumpState = 'OFF';
  let pumpReason = 'System Idle - Awaiting weight bearing load.';
  let pumpThresholdText = 'None';
  let pumpActive = false;
  
  const sensors = [
    { name: 'Toe FSR1', val: toeVal },
    { name: 'Ball FSR2', val: ballVal },
    { name: 'Arch FSR3', val: archVal },
    { name: 'Heel FSR4', val: heelVal }
  ];
  
  // Find if any sensor is above high threshold
  const activeSensor = sensors.find(s => s.val > highThreshold);
  
  if (activeSensor) {
    pumpState = 'ON';
    pumpActive = true;
    pumpReason = `High pressure detected on ${activeSensor.name} (${activeSensor.val} units).`;
    pumpThresholdText = `> ${highThreshold} units`;
  } else if (totalPress > 40) {
    pumpState = 'STANDBY';
    pumpReason = 'Moderate weight load detected. Pressure cells holding.';
    pumpThresholdText = `> 15 units (Standby)`;
  }
  
  // Update runtime
  const now = Date.now();
  if (pumpActive) {
    pumpRuntimeSec += (now - lastPumpRuntimeUpdate) / 1000;
  }
  lastPumpRuntimeUpdate = now;
  
  // Format runtime
  const runtimeHrs = Math.floor(pumpRuntimeSec / 3600);
  const runtimeMins = Math.floor((pumpRuntimeSec % 3600) / 60);
  const runtimeSecs = Math.floor(pumpRuntimeSec % 60);
  const runtimeStr = `${runtimeHrs}h ${runtimeMins}m ${runtimeSecs}s`;
  
  // Update Pump UI
  const pumpBadge = document.getElementById('sim-pump-badge');
  const pumpStateEl = document.getElementById('sim-pump-state');
  const pumpReasonEl = document.getElementById('sim-pump-reason');
  const pumpThreshEl = document.getElementById('sim-pump-threshold');
  const pumpRuntimeEl = document.getElementById('sim-pump-runtime');
  
  if (pumpBadge) {
    pumpBadge.innerText = pumpState;
    if (pumpState === 'ON') {
      pumpBadge.className = 'px-2 py-0.5 text-[8.5px] font-bold uppercase rounded bg-emerald-500/10 border border-emerald-500/20 text-[#4edea3] font-mono animate-pulse';
    } else if (pumpState === 'STANDBY') {
      pumpBadge.className = 'px-2 py-0.5 text-[8.5px] font-bold uppercase rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono';
    } else {
      pumpBadge.className = 'px-2 py-0.5 text-[8.5px] font-bold uppercase rounded bg-surface border border-border-low-light text-on-surface-variant font-mono';
    }
  }
  if (pumpStateEl) {
    pumpStateEl.innerText = pumpState;
    if (pumpState === 'ON') {
      pumpStateEl.className = 'text-base font-black font-mono tracking-wider uppercase px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-[#4edea3] animate-pulse';
    } else if (pumpState === 'STANDBY') {
      pumpStateEl.className = 'text-base font-black font-mono tracking-wider uppercase px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500';
    } else {
      pumpStateEl.className = 'text-base font-black font-mono tracking-wider uppercase px-3 py-1 rounded bg-surface border border-border-low-light text-on-surface-variant';
    }
  }
  if (pumpReasonEl) pumpReasonEl.innerText = pumpReason;
  if (pumpThreshEl) pumpThreshEl.innerText = pumpThresholdText;
  if (pumpRuntimeEl) pumpRuntimeEl.innerText = runtimeStr;
  
  // 2. Solenoid Valve Control Module
  const valveStates = [
    { state: 'CLOSED', class: 'px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-surface border border-border-low-light text-on-surface-variant', dot: 'bg-slate-500' },
    { state: 'PARTIALLY OPEN', class: 'px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-amber-500/10 border border-amber-500/20 text-amber-500', dot: 'bg-amber-500 animate-pulse' },
    { state: 'OPEN', class: 'px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-emerald-500/10 border border-emerald-500/20 text-[#4edea3] animate-pulse', dot: 'bg-emerald-500 animate-ping' }
  ];
  
  const getValveIndex = (val) => {
    if (val > highThreshold) return 2; // OPEN
    if (val > 100) return 1; // PARTIALLY OPEN
    return 0; // CLOSED
  };
  
  const v1Idx = getValveIndex(toeVal);
  const v2Idx = getValveIndex(ballVal);
  const v3Idx = getValveIndex(archVal);
  const v4Idx = getValveIndex(heelVal);
  
  const valveStateList = [v1Idx, v2Idx, v3Idx, v4Idx];
  
  for (let i = 0; i < 4; i++) {
    const idx = valveStateList[i];
    const stateEl = document.getElementById(`sim-valve-state-${i + 1}`);
    const dotEl = document.getElementById(`sim-valve-dot-${i + 1}`);
    if (stateEl) {
      stateEl.innerText = valveStates[idx].state;
      stateEl.className = valveStates[idx].class;
    }
    if (dotEl) {
      dotEl.className = `w-2.5 h-2.5 rounded-full transition-all duration-300 ${valveStates[idx].dot}`;
    }
  }
  
  // 3. Adaptive Air Cushion Simulation
  const targetInflationLevels = [
    Math.round((toeVal / 1023) * 100),
    Math.round((ballVal / 1023) * 100),
    Math.round((archVal / 1023) * 100),
    Math.round((heelVal / 1023) * 100)
  ];
  
  for (let i = 0; i < 4; i++) {
    const valEl = document.getElementById(`sim-cushion-val-${i + 1}`);
    const barEl = document.getElementById(`sim-cushion-bar-${i + 1}`);
    const stateEl = document.getElementById(`sim-cushion-state-${i + 1}`);
    
    const target = targetInflationLevels[i];
    let current = currentInflationLevels[i];
    let status = 'Idle';
    let statusClass = 'text-[8px] uppercase tracking-wider font-bold text-on-surface-variant w-[55px] text-right';
    
    if (current < target) {
      // Inflate smoothly (+3% per step)
      current = Math.min(target, current + 3);
      status = 'Inflating';
      statusClass = 'text-[8px] uppercase tracking-wider font-bold text-emerald-400 animate-pulse w-[55px] text-right';
    } else if (current > target) {
      // Deflate smoothly (-4% per step)
      current = Math.max(target, current - 4);
      status = 'Deflating';
      statusClass = 'text-[8px] uppercase tracking-wider font-bold text-slate-400 w-[55px] text-right';
    } else {
      status = current > 0 ? 'Holding' : 'Idle';
      statusClass = current > 0 
        ? 'text-[8px] uppercase tracking-wider font-bold text-amber-500 w-[55px] text-right' 
        : 'text-[8px] uppercase tracking-wider font-bold text-on-surface-variant w-[55px] text-right';
    }
    
    currentInflationLevels[i] = current;
    
    if (valEl) valEl.innerText = current;
    if (barEl) barEl.style.width = `${current}%`;
    if (stateEl) {
      stateEl.innerText = status;
      stateEl.className = statusClass;
    }

  }
  
  // 4. LM2596 Power Management Module
  const powerBadge = document.getElementById('sim-power-badge');
  const vinEl = document.getElementById('sim-power-vin');
  const voutEl = document.getElementById('sim-power-vout');
  const currEl = document.getElementById('sim-power-curr');
  const effEl = document.getElementById('sim-power-eff');
  const pumpPwrEl = document.getElementById('sim-power-pump-pwr');
  
  let currentLoad = 0.12; // Base quiescent load
  if (pumpState === 'ON') currentLoad += 0.85;
  if (pumpState === 'STANDBY') currentLoad += 0.08;
  valveStateList.forEach(v => {
    if (v === 2) currentLoad += 0.22; // OPEN
    if (v === 1) currentLoad += 0.11; // PARTIALLY OPEN
  });
  
  let vin = totalPress > 40 ? (12.0 + Math.sin(now / 5000) * 0.08) : 12.0;
  let vout = totalPress > 40 ? (5.02 + Math.cos(now / 7000) * 0.01) : 5.02;
  
  // Power efficiency curve
  let efficiency = 92.1;
  if (currentLoad > 0.8) efficiency = 91.4;
  else if (currentLoad > 0.2) efficiency = 92.7;
  
  let pumpPwr = pumpState === 'ON' ? (vout * 0.85) : 0.0;
  
  let powerState = 'IDLE';
  if (currentLoad > 1.3) powerState = 'OVERLOAD';
  else if (currentLoad > 0.2) powerState = 'ACTIVE';
  
  if (powerBadge) {
    powerBadge.innerText = powerState;
    if (powerState === 'ACTIVE') {
      powerBadge.className = 'px-2 py-0.5 text-[8.5px] font-bold uppercase rounded bg-emerald-500/10 border border-emerald-500/20 text-[#4edea3] font-mono';
    } else if (powerState === 'OVERLOAD') {
      powerBadge.className = 'px-2 py-0.5 text-[8.5px] font-bold uppercase rounded bg-error/10 border border-error/20 text-error font-mono animate-bounce';
    } else {
      powerBadge.className = 'px-2 py-0.5 text-[8.5px] font-bold uppercase rounded bg-surface border border-border-low-light text-on-surface-variant font-mono';
    }
  }
  if (vinEl) vinEl.innerText = `${vin.toFixed(2)} V`;
  if (voutEl) voutEl.innerText = `${vout.toFixed(2)} V`;
  if (currEl) currEl.innerText = `${currentLoad.toFixed(2)} A`;
  if (effEl) effEl.innerText = `${efficiency.toFixed(1)}%`;
  if (pumpPwrEl) pumpPwrEl.innerText = `${pumpPwr.toFixed(2)} W`;
  
  // Highlight active schematic nodes
  const nodeLM = document.getElementById('schematic-node-lm');
  const nodePump = document.getElementById('schematic-node-pump');
  const nodeValves = document.getElementById('schematic-node-valves');
  const nodeCushions = document.getElementById('schematic-node-cushions');
  
  if (nodeLM) {
    if (totalPress > 40) {
      nodeLM.className = 'px-1 py-0.5 rounded border border-[#4edea3] bg-[#4edea3]/10 text-[#4edea3] select-none';
    } else {
      nodeLM.className = 'px-1 py-0.5 rounded border border-border-low-light bg-surface select-none';
    }
  }
  if (nodePump) {
    if (pumpState === 'ON') {
      nodePump.className = 'px-1 py-0.5 rounded border border-[#4edea3] bg-[#4edea3]/15 text-[#4edea3] font-bold select-none animate-pulse';
    } else if (pumpState === 'STANDBY') {
      nodePump.className = 'px-1 py-0.5 rounded border border-amber-500/50 bg-amber-500/10 text-amber-500 select-none';
    } else {
      nodePump.className = 'px-1 py-0.5 rounded border border-border-low-light bg-surface select-none';
    }
  }
  if (nodeValves) {
    const activeValves = valveStateList.filter(v => v > 0).length;
    if (activeValves > 0) {
      nodeValves.className = 'px-1 py-0.5 rounded border border-secondary bg-secondary/15 text-secondary font-bold select-none';
    } else {
      nodeValves.className = 'px-1 py-0.5 rounded border border-border-low-light bg-surface select-none';
    }
  }
  if (nodeCushions) {
    const activeCushions = currentInflationLevels.filter(c => c > 10).length;
    if (activeCushions > 0) {
      nodeCushions.className = 'px-1 py-0.5 rounded border border-tertiary bg-tertiary/15 text-tertiary font-bold select-none';
    } else {
      nodeCushions.className = 'px-1 py-0.5 rounded border border-border-low-light bg-surface select-none';
    }
  }
  

};

// Update UI elements from raw sensor telemetry
const updateDashboardTelemetry = () => {
  const h = sensorData.heel;
  const ib = sensorData.inner_ball;
  const ob = sensorData.outer_ball;
  const a = sensorData.arch;

  // Update numeric displays matching PSI mockup conversions
  document.getElementById('val-heel').innerText = h > 0 ? `${(h / 22).toFixed(1)} PSI` : '0';
  document.getElementById('val-inner').innerText = ib > 0 ? `${(ib / 80).toFixed(1)} PSI` : '0';
  document.getElementById('val-outer').innerText = ob > 0 ? `${(ob / 110).toFixed(1)} PSI` : '0';
  document.getElementById('val-arch').innerText = a > 0 ? `${(a / 36).toFixed(1)} PSI` : '0';



  const diag = getDiagnosis(ib, a, ob, h);
  
  // Decide active glow color based strictly on overall stance diagnosis
  let activeGlowColor = 'rgba(0, 0, 0, 0)'; // Default to no color
  if (diag.classification === 'Normal Arch') {
    activeGlowColor = 'rgba(16, 185, 129, 0.85)'; // Green for Normal Foot
  } else if (diag.classification === 'Severe Flat Foot' || diag.classification === 'High Arch') {
    activeGlowColor = 'rgba(239, 68, 68, 0.85)'; // Full Red for Flat & High Arch
  }

  // Update vector footprint SVGs color/radius glows
  const svgArch = document.getElementById('glow-circle-arch');
  const svgInner = document.getElementById('glow-circle-inner');
  const svgOuter = document.getElementById('glow-circle-outer');
  const svgHeel = document.getElementById('glow-circle-heel');

  svgArch.setAttribute('fill', getPressureColor(a, activeGlowColor));
  svgArch.setAttribute('r', getGlowRadius(a, activeGlowColor));
  document.getElementById('blur-arch').setAttribute('stdDeviation', getGlowBlur(a, activeGlowColor));

  svgInner.setAttribute('fill', getPressureColor(ib, activeGlowColor));
  svgInner.setAttribute('r', getGlowRadius(ib, activeGlowColor));
  document.getElementById('blur-inner').setAttribute('stdDeviation', getGlowBlur(ib, activeGlowColor));

  svgOuter.setAttribute('fill', getPressureColor(ob, activeGlowColor));
  svgOuter.setAttribute('r', getGlowRadius(ob, activeGlowColor));
  document.getElementById('blur-outer').setAttribute('stdDeviation', getGlowBlur(ob, activeGlowColor));

  svgHeel.setAttribute('fill', getPressureColor(h, activeGlowColor));
  svgHeel.setAttribute('r', getGlowRadius(h, activeGlowColor));
  document.getElementById('blur-heel').setAttribute('stdDeviation', getGlowBlur(h, activeGlowColor));

  const total = h + ib + ob + a;
  const ratio = total > 0 ? (a / total) : 0;

  // Update prototype simulation modules
  updateHardwareSimulationUI(ib, a, ob, h, total, diag, activeGlowColor);

  // Handle scanning sweeps on foot container
  const scanline = document.getElementById('xray-scanline');
  if (scanline) {
    const footContainer = scanline.parentElement;
    if (total >= 40) {
      scanline.classList.add('scanning');
      if (footContainer) footContainer.classList.add('scanning');
    } else {
      scanline.classList.remove('scanning');
      if (footContainer) footContainer.classList.remove('scanning');
    }
  }

  // Update circular SVG gauge progress
  const gaugeBar = document.getElementById('gauge-bar');
  const circumference = 364.4; // 2 * pi * 58
  const maxScaleRatio = 0.45;
  const progressPct = Math.min(100, (ratio / maxScaleRatio) * 100);
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  if (total < 40) {
    gaugeBar.setAttribute('stroke-dashoffset', circumference);
    gaugeBar.setAttribute('stroke', '#333539');
    document.getElementById('gauge-ratio-text').innerText = '0.00';
  } else {
    gaugeBar.setAttribute('stroke-dashoffset', strokeDashoffset);
    gaugeBar.setAttribute('stroke', (diag.accent && diag.accent !== 'rgba(0, 0, 0, 0)' && diag.accent !== 'transparent') ? diag.accent : '#333539');
    document.getElementById('gauge-ratio-text').innerText = ratio.toFixed(2);
  }

  // Update diagnosis header details
  const headTitle = document.getElementById('diag-header-title');
  headTitle.innerText = diag.title;
  headTitle.style.color = (diag.color && diag.color !== 'rgba(0, 0, 0, 0)' && diag.color !== 'transparent') ? diag.color : 'var(--text-primary)';
  document.getElementById('diag-desc-text').innerText = diag.description;

  // Update big heatmap status display below foot sole
  const statusTextEl = document.getElementById('heatmap-status-text');
  if (statusTextEl) {
    let displayText = 'NO WEIGHT BEARING';
    if (diag.classification === 'Normal Arch') displayText = 'NORMAL ARCH PROFILE';
    else if (diag.classification === 'Severe Flat Foot') displayText = 'FLAT FOOT (PES PLANUS)';
    else if (diag.classification === 'High Arch') displayText = 'HIGH ARCH (PES CAVUS)';
    
    statusTextEl.innerText = displayText;
    statusTextEl.style.color = (diag.color && diag.color !== 'rgba(0, 0, 0, 0)' && diag.color !== 'transparent') ? diag.color : 'var(--on-surface-variant)';
  }

  // Clinical pain recommendations removed per user request

  // Standalone mode: Autosave / SQLite progression warnings removed per user request
};

// --- SYNC WORKSPACE RECENT TIMELINE TABLE ---
// --- LIVE STANDALONE SESSION LOGS ---
let sessionLogs = [];
let lastLoggedStance = "";

const addLiveSessionLog = (classification, heel, inner_ball, outer_ball, arch, ratio, color) => {
  // Prevent logging repetitive states
  if (classification === lastLoggedStance) return;
  lastLoggedStance = classification;
  
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  let statusText = 'EMPTY';
  let statusClass = 'bg-surface-variant/20 text-on-surface-variant border-border-low-light';
  if (classification === 'Normal Arch') {
    statusText = 'NORMAL';
    statusClass = 'bg-emerald-500/10 text-[#4edea3] border-[#4edea3]/20';
  } else if (classification === 'Severe Flat Foot') {
    statusText = 'FLAT';
    statusClass = 'bg-error/10 text-error border-error/20';
  } else if (classification === 'High Arch') {
    statusText = 'HIGH';
    statusClass = 'bg-error/10 text-error border-error/20';
  }
  
  const newLog = {
    time: timeStr,
    classification,
    detail: `FSR: H(${(heel/10).toFixed(1)}) · IB(${(inner_ball/10).toFixed(1)}) · A(${(arch/10).toFixed(1)})`,
    status: statusText,
    statusClass,
    color: (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') ? color : ''
  };
  
  // Prepend to session log history (max 20 entries)
  sessionLogs.unshift(newLog);
  if (sessionLogs.length > 20) sessionLogs.pop();
  
  renderLiveSessionTimeline();
};

const renderLiveSessionTimeline = () => {
  const tableBody = document.getElementById('recent-telemetry-logs-table-body');
  const emptyPlaceholder = document.getElementById('recent-logs-empty-placeholder');
  const countBadge = document.getElementById('recent-logs-count-badge');
  
  if (!tableBody) return;
  tableBody.innerHTML = '';
  
  if (sessionLogs.length === 0) {
    if (emptyPlaceholder) emptyPlaceholder.classList.remove('hidden');
    if (countBadge) countBadge.innerText = '0 LOGS';
    return;
  }
  
  if (emptyPlaceholder) emptyPlaceholder.classList.add('hidden');
  if (countBadge) countBadge.innerText = `${sessionLogs.length} DETECTED LOGS`;
  
  sessionLogs.forEach(log => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-surface-variant/20 transition-colors group border-b border-border-low-light/50';
    
    const colorStyle = log.color ? `color: ${log.color}` : '';
    
    tr.innerHTML = `
      <td class="p-3 font-label-mono-sm text-label-mono-sm text-on-surface-variant">${log.time}</td>
      <td class="p-3">
        <p class="text-xs font-bold" style="${colorStyle}">${log.classification}</p>
        <p class="text-[10px] text-on-surface-variant">${log.detail}</p>
      </td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${log.statusClass}">${log.status}</span>
      </td>
      <td class="p-3">
        <button class="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer" onclick="switchTab('education')">open_in_new</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
};

// Standalone mode: Patient cards and progress bars removed per user request

// --- SYNC REHAB ARTICLES HUB (IMAGE 3 MOCKUP) ---
const syncRehabArticlesMockupHub = () => {
  const grid = document.getElementById('mockup-article-cards-grid');
  grid.innerHTML = '';

  MOCK_ARTICLES.forEach(art => {
    const isSelected = selectedArtId === art.id;
    const card = document.createElement('div');
    
    let categoryClass = 'bg-primary/10 text-primary border-primary/20';
    if (art.category === 'HIGH PRIORITY') categoryClass = 'bg-error/10 text-error border-error/20';
    if (art.category === 'PATHOLOGY') categoryClass = 'bg-[#D946EF]/10 text-[#D946EF] border-[#D946EF]/20';
    
    card.className = `glass-panel p-5 border flex flex-col justify-between cursor-pointer transition-all duration-300 min-h-[190px] ${
      isSelected ? 'border-primary glow-cyan bg-primary/5' : 'border-border-low-light hover:border-primary/50'
    }`;
    
    card.onclick = () => {
      selectedArtId = art.id;
      loadRehabHubUI();
      // Smooth scroll reader into view
      document.getElementById('expanded-article-card-details').classList.remove('hidden');
      document.getElementById('expanded-article-card-details').scrollIntoView({ behavior: 'smooth' });
    };

    card.innerHTML = `
      <div>
        <div class="flex justify-between items-center mb-3">
          <span class="px-2 py-0.5 border rounded-sm text-[8px] font-bold tracking-widest uppercase ${categoryClass}">${art.category}</span>
          <span class="text-[9px] font-label-mono-sm text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">schedule</span> ${art.read_time}</span>
        </div>
        <h4 class="font-headline-md text-sm font-bold text-on-surface leading-tight mb-2">${art.title.split(': ')[0]}</h4>
        <p class="text-[11px] text-on-surface-variant leading-relaxed line-clamp-3">${art.summary}</p>
      </div>
      <div class="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider border-t border-border-low-light pt-3 mt-4 hover:text-primary/80 transition-colors">
        <span>View Dataset</span>
        <span class="material-symbols-outlined text-xs">arrow_forward</span>
      </div>
    `;
    grid.appendChild(card);
  });
};

// --- SYNC REHAB EXERCISES VIDEO GRIDS (8 PREMIUM CARDS DIRECTING TO YOUTUBE) ---
const syncRehabExercisesMockupGrid = () => {
  const grid = document.getElementById('mockup-exercises-grid');
  grid.innerHTML = '';

  MOCK_EXERCISES.forEach(ex => {
    const card = document.createElement('div');
    
    let difficultyBadge = 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/20';
    if (ex.difficulty === 'Medium') difficultyBadge = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (ex.difficulty === 'Hard') difficultyBadge = 'bg-error/10 text-error border-error/20';

    // Premium glowing thumbnail with a play icon
    const thumbnailSVG = `
      <div class="relative w-full h-[140px] rounded-lg overflow-hidden bg-surface-container-lowest border border-border-low-light flex items-center justify-center">
        <!-- Abstract blueprint grid pattern -->
        <div class="absolute inset-0 w-full h-full opacity-10 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div class="w-12 h-12 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/25 transition-all duration-300 shadow-lg shadow-primary/10">
          <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
        </div>
        <span class="absolute top-2 left-2 text-[8px] uppercase font-bold bg-surface border border-border-low-light px-2 py-0.5 rounded text-primary tracking-widest font-mono">
          ${ex.target_area.split(' ')[0]}
        </span>
      </div>
    `;

    card.className = "glass-panel p-4 border border-border-low-light flex flex-col gap-3 cursor-pointer group transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5";
    
    // Clicking card opens the YouTube video directly in a new tab
    card.onclick = () => {
      window.open(ex.youtube_url, '_blank');
    };

    card.innerHTML = `
      ${thumbnailSVG}
      <div class="flex flex-col justify-between flex-grow">
        <div class="mb-3">
          <div class="flex justify-between items-center text-xs font-bold text-on-surface mb-1">
            <span class="truncate text-sm font-['Outfit'] group-hover:text-primary transition-colors">${ex.name}</span>
          </div>
          <p class="text-[11px] text-on-surface-variant leading-relaxed line-clamp-2 mt-1">${ex.description}</p>
        </div>

        <div class="flex justify-between items-center border-t border-border-low-light pt-2.5 mt-auto">
          <span class="px-2 py-0.5 border rounded-sm text-[8px] font-bold uppercase ${difficultyBadge}">${ex.difficulty}</span>
          <span class="text-[9px] text-[#4edea3] font-bold uppercase tracking-widest">${ex.frequency}</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
};

// --- TAB ROUTER SWITCHER ---
const switchTab = (tab) => {
  currentTab = tab;
  
  // Header Tabs style sync
  const hBtns = ['live', 'education'];
  hBtns.forEach(b => {
    const btn = document.getElementById(`tab-btn-${b}`);
    if (btn) {
      if (b === tab) {
        btn.className = 'bg-primary-container text-on-primary-container rounded-full px-6 py-1.5 font-medium transition-all duration-300';
      } else {
        btn.className = 'text-on-surface-variant hover:text-primary transition-all duration-300 px-6 py-1.5 rounded-full font-medium';
      }
    }
  });

  // Sidebar Tabs style sync
  const sBtns = ['live', 'telemetry', 'rehab'];
  const mapped = { 'live': 'live', 'telemetry': 'live', 'rehab': 'education' };
  sBtns.forEach(b => {
    const btn = document.getElementById(`sidebar-${b}-btn`);
    if (btn) {
      if (mapped[b] === tab) {
        btn.className = 'flex items-center gap-3 w-full text-left py-3 px-4 rounded bg-primary/10 border-r-2 border-primary text-primary transition-all duration-300';
      } else {
        btn.className = 'flex items-center gap-3 w-full text-left py-3 px-4 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-all duration-300';
      }
    }
  });

  // Show/Hide grids
  const viewLive = document.getElementById('tab-view-live');
  const viewEdu = document.getElementById('tab-view-education');
  
  if (viewLive) viewLive.classList.add('hidden');
  if (viewEdu) viewEdu.classList.add('hidden');
  
  if (tab === 'live') {
    if (viewLive) viewLive.classList.remove('hidden');
    document.getElementById('connection-bar-shared').classList.remove('hidden');
    document.getElementById('educational-footer-panel').classList.remove('hidden');
  } else if (tab === 'education') {
    if (viewEdu) viewEdu.classList.remove('hidden');
    document.getElementById('connection-bar-shared').classList.add('hidden'); // Hide connection bar on education
    document.getElementById('educational-footer-panel').classList.add('hidden'); // Hide footer on education
    
    syncRehabExercisesMockupGrid();
  }
};

// Standalone mode: Patient profile dropdowns and charts sync functions removed per user request

// --- SIMULATOR & WEB SERIAL STREAM HANDLERS ---

const startDemoStream = (initialStance = 'normal') => {
  stopStreams();
  
  isDemoMode = true;
  serialConnected = true;
  demoStance = initialStance;
  demoTimeIndex = 0;
  
  document.getElementById('btn-start-demo').classList.add('hidden');
  document.getElementById('btn-link-arduino').classList.add('hidden');
  document.getElementById('btn-stop-stream').classList.remove('hidden');
  document.getElementById('sim-selector-wrapper').classList.remove('hidden');
  document.getElementById('sim-selector-wrapper').classList.remove('flex');
  document.getElementById('sim-selector-wrapper').classList.add('flex');
  
  const statusBadge = document.getElementById('global-status-badge');
  if (statusBadge) statusBadge.className = 'flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full';
  
  const statusDot = document.getElementById('global-status-dot');
  if (statusDot) statusDot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
  
  const statusText = document.getElementById('global-status-text');
  if (statusText) statusText.innerText = 'DEMO STREAM';
  
  const statusTitle = document.getElementById('conn-status-title');
  if (statusTitle) {
    statusTitle.innerText = 'PROACTIVE SIMULATOR ACTIVE';
    statusTitle.className = 'font-label-mono-lg text-label-mono-lg text-[#4edea3] font-bold uppercase tracking-widest';
  }
  
  demoTimer = setInterval(() => {
    demoTimeIndex += 0.1;
    
    if (demoStance === 'normal') {
      const noise = Math.sin(demoTimeIndex * 2) * 15;
      sensorData.heel = Math.round(590 + noise);
      sensorData.inner_ball = Math.round(435 + noise);
      sensorData.outer_ball = Math.round(10 + noise * 0.1); // Keep Arch <= 15 (unpressed)
      sensorData.arch = Math.round(115 + noise * 0.3); // Pressed
    } else if (demoStance === 'flat') {
      const noise = Math.sin(demoTimeIndex * 2.5) * 15;
      sensorData.heel = Math.round(550 + noise);
      sensorData.inner_ball = Math.round(485 + noise);
      sensorData.outer_ball = Math.round(390 + noise);
      sensorData.arch = Math.round(610 + noise);
    } else if (demoStance === 'high-arch') {
      const noise = Math.sin(demoTimeIndex * 3) * 10;
      sensorData.heel = Math.round(660 + noise);
      sensorData.inner_ball = Math.round(400 + noise);
      sensorData.outer_ball = Math.round(10 + noise * 0.1); // Keep Arch <= 15 (unpressed)
      sensorData.arch = Math.round(5 + Math.max(0, noise * 0.1)); // Keep Ball <= 15 (unpressed)
    } else if (demoStance === 'walking') {
      const cycleTime = (demoTimeIndex * 1.5) % (2 * Math.PI);
      
      sensorData.heel = 10;
      sensorData.inner_ball = 15;
      sensorData.outer_ball = 12;
      sensorData.arch = 8;
      
      if (cycleTime >= 0 && cycleTime < Math.PI / 2) {
        const factor = Math.sin(cycleTime * 2);
        sensorData.heel = Math.round(650 * factor);
        sensorData.outer_ball = Math.round(50 * factor);
      } else if (cycleTime >= Math.PI / 2 && cycleTime < Math.PI) {
        const factor = Math.sin((cycleTime - Math.PI/2) * 2);
        sensorData.heel = Math.round(400 * (1 - factor));
        sensorData.outer_ball = Math.round(500 * factor + 50);
        sensorData.arch = Math.round(150 * factor);
      } else if (cycleTime >= Math.PI && cycleTime < 3 * Math.PI / 2) {
        const factor = Math.sin((cycleTime - Math.PI) * 2);
        sensorData.outer_ball = Math.round(550 * (1 - factor));
        sensorData.inner_ball = Math.round(620 * factor);
        sensorData.arch = Math.round(150 * (1 - factor));
      } else {
        sensorData.heel = 0;
        sensorData.inner_ball = 0;
        sensorData.outer_ball = 0;
        sensorData.arch = 0;
      }
    }
    
    updateDashboardTelemetry();
    
    // Live tracking of stance details in the timeline - ONLY when state changes
    const total = sensorData.heel + sensorData.inner_ball + sensorData.outer_ball + sensorData.arch;
    const ratio = total > 0 ? (sensorData.arch / total) : 0;
    const diag = getDiagnosis(sensorData.inner_ball, sensorData.arch, sensorData.outer_ball, sensorData.heel);
    addLiveSessionLog(diag.classification, sensorData.heel, sensorData.inner_ball, sensorData.outer_ball, sensorData.arch, ratio, diag.color);
  }, 100);
  
  showToastNotification('Gait diagnostic simulator connected. Stance metrics streaming.');
};

// --- WEB SERIAL & MONOSPACE DEBUG MONITOR CORE ---
let isConsoleOpen = false;

const toggleSerialConsole = (forceState = null) => {
  const body = document.getElementById('serial-console-body');
  const chevron = document.getElementById('console-chevron');
  if (!body || !chevron) return;
  
  const nextState = (forceState !== null) ? forceState : !isConsoleOpen;
  
  if (nextState) {
    body.style.height = '120px';
    chevron.style.transform = 'rotate(180deg)';
    isConsoleOpen = true;
  } else {
    body.style.height = '0px';
    chevron.style.transform = 'rotate(0deg)';
    isConsoleOpen = false;
  }
};const appendConsoleLog = (type, message, customColor = null) => {
  const terminal = document.getElementById('serial-terminal-logs');
  const clearBtn = document.getElementById('btn-clear-console-logs');
  if (!terminal) return;
  
  if (type === 'RX') {
    if (clearBtn) clearBtn.classList.add('hidden');
    
    let iconName = 'sensors';
    let alertTitle = 'INITIALIZING SENSORS';
    let pulseClass = 'animate-pulse';
    
    if (message.includes('Normal')) {
      iconName = 'check_circle';
      alertTitle = 'NORMAL FOOT ARCH DETECTED';
      pulseClass = '';
    } else if (message.includes('Flat')) {
      iconName = 'warning';
      alertTitle = 'PES PLANUS (FLAT FOOT) DETECTED';
      pulseClass = 'animate-bounce';
    } else if (message.includes('High')) {
      iconName = 'warning';
      alertTitle = 'PES CAVUS (HIGH ARCH) DETECTED';
      pulseClass = '';
    } else if (message.includes('No Weight')) {
      iconName = 'footprint';
      alertTitle = 'AWAITING WEIGHT BEARING LOAD';
      pulseClass = 'animate-pulse';
    }
    
    const isNoColor = !customColor || customColor === 'rgba(0, 0, 0, 0)' || customColor === 'transparent' || message.includes('No Weight');
    const badgeBg = isNoColor ? 'rgba(255, 255, 255, 0.03)' : `${customColor}10`;
    const badgeBorder = isNoColor ? 'var(--border-low-light)' : customColor;
    const badgeGlow = isNoColor ? 'none' : `0 0 15px ${customColor}`;
    const textGlow = isNoColor ? 'none' : `0 0 10px ${customColor}40`;
    const textColor = isNoColor ? 'var(--text-primary)' : customColor;
    const iconColor = isNoColor ? 'var(--text-secondary)' : customColor;
    
    terminal.style.overflow = 'hidden';
    terminal.innerHTML = `
      <div class="flex flex-col sm:flex-row items-center justify-center gap-6 h-full w-full py-2 px-4 transition-all duration-300">
        <!-- Glowing Alert Icon Badge -->
        <div class="w-14 h-14 rounded-full flex items-center justify-center border-2 ${pulseClass} shrink-0" 
             style="background: ${badgeBg}; 
                    border-color: ${badgeBorder}; 
                    box-shadow: ${badgeGlow};">
          <span class="material-symbols-outlined text-3xl" style="color: ${iconColor}; font-variation-settings: 'FILL' 1;">${iconName}</span>
        </div>
        
        <!-- Diagnostic Status Copy -->
        <div class="text-center sm:text-left flex flex-col justify-center">
          <p class="font-label-mono-sm text-[9px] tracking-widest text-on-surface-variant uppercase mb-1">Telemetry Status</p>
          <h3 class="font-headline-md text-base sm:text-lg font-black tracking-wide uppercase transition-all duration-300" 
               style="color: ${textColor}; text-shadow: ${textGlow};">
            ${alertTitle}
          </h3>
        </div>
      </div>
    `;
    return;
  }
  
  if (type === 'SYSTEM' || type === 'ERROR') {
    terminal.innerHTML = `
      <div class="flex items-center justify-center gap-4 h-full w-full py-4 px-4 text-center">
        <span class="material-symbols-outlined text-2xl text-primary animate-pulse">settings</span>
        <p class="font-label-mono-sm text-xs font-bold text-on-surface-variant uppercase tracking-widest">${message}</p>
      </div>
    `;
  }
};

// Troubleshooting Modal Actions
const toggleTroubleshootingModal = (isOpen) => {
  const overlay = document.getElementById('troubleshoot-backdrop-overlay');
  if (overlay) {
    if (isOpen) {
      overlay.classList.add('active');
    } else {
      overlay.classList.remove('active');
    }
  }
};

const stopStreams = async () => {
  if (demoTimer) {
    clearInterval(demoTimer);
    demoTimer = null;
  }
  isDemoMode = false;
  
  serialKeepReading = false;
  
  if (serialReader) {
    try {
      await serialReader.cancel();
    } catch(e){}
    serialReader = null;
  }
  
  if (serialPort) {
    try {
      await serialPort.close();
    } catch(e){}
    serialPort = null;
  }
  
  serialConnected = false;
  
  sensorData = { heel: 0, inner_ball: 0, outer_ball: 0, arch: 0 };
  updateDashboardTelemetry();
  
  document.getElementById('btn-start-demo').classList.remove('hidden');
  document.getElementById('btn-link-arduino').classList.remove('hidden');
  document.getElementById('btn-stop-stream').classList.add('hidden');
  document.getElementById('sim-selector-wrapper').classList.add('hidden');
  document.getElementById('sim-selector-wrapper').classList.remove('flex');
  
  const statusBadge = document.getElementById('global-status-badge');
  if (statusBadge) statusBadge.className = 'flex items-center gap-2 bg-error/10 border border-error/20 px-3 py-1 rounded-full';
  
  const statusDot = document.getElementById('global-status-dot');
  if (statusDot) statusDot.className = 'w-2 h-2 rounded-full bg-error animate-pulse';
  
  const statusText = document.getElementById('global-status-text');
  if (statusText) statusText.innerText = 'OFFLINE';
  
  const statusTitle = document.getElementById('conn-status-title');
  if (statusTitle) {
    statusTitle.innerText = 'Hardware Disconnected';
    statusTitle.className = 'font-label-mono-lg text-label-mono-lg text-error font-bold uppercase tracking-widest';
  }
  
  // Console state sync
  const consoleDot = document.getElementById('console-live-dot');
  if (consoleDot) {
    consoleDot.className = 'w-1.5 h-1.5 rounded-full bg-rose-500';
  }
  appendConsoleLog("SYSTEM", "Serial telemetry capture interface offline.");
};

const connectArduinoSerial = async () => {
  if (!('serial' in navigator)) {
    alert('Web Serial API is not supported by your browser. Please use Google Chrome or Microsoft Edge.');
    return;
  }
  
  const consoleDot = document.getElementById('console-live-dot');
  if (consoleDot) {
    consoleDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse';
  }
  
  try {
    await stopStreams();
    
    appendConsoleLog("SYSTEM", "Requesting device port permission from OS...");
    serialPort = await navigator.serial.requestPort();
    
    const baudSelect = document.getElementById('serial-baud-rate');
    const baudRate = parseInt(baudSelect ? baudSelect.value : 9600) || 9600;
    
    appendConsoleLog("SYSTEM", `Opening serial COM port at ${baudRate} Baud...`);
    await serialPort.open({ baudRate: baudRate });
    
    serialConnected = true;
    serialKeepReading = true;
    
    document.getElementById('btn-start-demo').classList.add('hidden');
    document.getElementById('btn-link-arduino').classList.add('hidden');
    document.getElementById('btn-stop-stream').classList.remove('hidden');
    
    const statusBadge = document.getElementById('global-status-badge');
    if (statusBadge) statusBadge.className = 'flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full';
    
    const statusDot = document.getElementById('global-status-dot');
    if (statusDot) statusDot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
    
    const statusText = document.getElementById('global-status-text');
    if (statusText) statusText.innerText = 'DEVICE ACTIVE';
    
    const statusTitle = document.getElementById('conn-status-title');
    if (statusTitle) {
      statusTitle.innerText = 'FSR HARDWARE ONLINE';
      statusTitle.className = 'font-label-mono-lg text-label-mono-lg text-emerald-400 font-bold uppercase tracking-widest';
    }
    
    if (consoleDot) {
      consoleDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse';
    }
    
    appendConsoleLog("SYSTEM", `Connection established! Streaming live data feed at ${baudRate} bps.`);
    toggleSerialConsole(true); // Open the console drawer automatically
    
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = serialPort.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    serialReader = reader;
    
    let buffer = '';
    
    while (serialKeepReading) {
      try {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop();
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          let heel = 0, inner = 0, outer = 0, arch = 0;
          let parsedSuccessfully = false;
          
          // Format Option 1: User's custom format "FSR1: val1 | FSR2: val2 | FSR3: val3 | FSR4: val4"
          const customMatch = trimmed.match(/FSR1:\s*(-?\d+)\s*\|\s*FSR2:\s*(-?\d+)\s*\|\s*FSR3:\s*(-?\d+)\s*\|\s*FSR4:\s*(-?\d+)/i);
          if (customMatch) {
            inner = parseInt(customMatch[1]) || 0;
            arch = parseInt(customMatch[2]) || 0;
            outer = parseInt(customMatch[3]) || 0;
            heel = parseInt(customMatch[4]) || 0;
            parsedSuccessfully = true;
          }
          
          // Format Option 2: Standard "FSR:v1,v2,v3,v4" or case-insensitive equivalent
          if (!parsedSuccessfully && trimmed.toUpperCase().includes('FSR:')) {
            const index = trimmed.toUpperCase().indexOf('FSR:');
            const dataStr = trimmed.substring(index + 4);
            const parts = dataStr.split(',').map(p => p.trim());
            if (parts.length === 4) {
              inner = parseInt(parts[0]) || 0;
              arch = parseInt(parts[1]) || 0;
              outer = parseInt(parts[2]) || 0;
              heel = parseInt(parts[3]) || 0;
              parsedSuccessfully = true;
            }
          }
          
          // Format Option 3: Fallback to matching any 4 integers in the line (flexible for raw CSV e.g. "120,400,290,0")
          if (!parsedSuccessfully) {
            const matches = trimmed.match(/-?\d+/g);
            if (matches && matches.length >= 4) {
              inner = parseInt(matches[0]) || 0;
              arch = parseInt(matches[1]) || 0;
              outer = parseInt(matches[2]) || 0;
              heel = parseInt(matches[3]) || 0;
              parsedSuccessfully = true;
            }
          }
          
          if (parsedSuccessfully) {
            sensorData.heel = heel;
            sensorData.inner_ball = inner;
            sensorData.outer_ball = outer;
            sensorData.arch = arch;
            updateDashboardTelemetry();
            
            // Display overall message with color indication instead of raw readings
            const diag = getDiagnosis(inner, arch, outer, heel);
            appendConsoleLog("RX", diag.classification, diag.color);
            
            // Live tracking of stance details in the timeline - ONLY when state changes
            const total = heel + inner + outer + arch;
            const ratio = total > 0 ? (arch / total) : 0;
            addLiveSessionLog(diag.classification, heel, inner, outer, arch, ratio, diag.color);
          } else {
            appendConsoleLog("RX", trimmed);
          }
        }
      } catch (err) {
        console.error('Read loop exception:', err);
        appendConsoleLog("ERROR", `Stream read error: ${err.message}`);
        break;
      }
    }
    
    reader.releaseLock();
    await readableStreamClosed;
  } catch (err) {
    console.error('Serial connection error:', err);
    appendConsoleLog("ERROR", `Hardware connection failure: ${err.message || err}`);
    if (consoleDot) {
      consoleDot.className = 'w-1.5 h-1.5 rounded-full bg-rose-500';
    }
    await stopStreams();
    alert(`Failed to establish connection with Arduino Device serial port: ${err.message || err}`);
  }
};

// --- BIND HTML EVENT LISTENERS ---
// Header Navigation
document.getElementById('tab-btn-live').addEventListener('click', () => switchTab('live'));
document.getElementById('tab-btn-education').addEventListener('click', () => switchTab('education'));

// Sidebar Navigation
document.getElementById('sidebar-live-btn').addEventListener('click', () => switchTab('live'));
document.getElementById('sidebar-telemetry-btn').addEventListener('click', () => switchTab('live'));
document.getElementById('sidebar-rehab-btn').addEventListener('click', () => switchTab('education')); // Map directly to Rehab & Education

// Footer buttons click switches tabs
document.getElementById('footer-btn-rehab').addEventListener('click', () => {
  switchTab('education');
});

// Connection and Demo simulation
document.getElementById('btn-start-demo').addEventListener('click', () => startDemoStream('normal'));
document.getElementById('btn-stop-stream').addEventListener('click', stopStreams);

// Hook Sim selector stance buttons
const stanceBtns = document.querySelectorAll('.sim-stance-btn');
stanceBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    stanceBtns.forEach(b => {
      b.className = 'px-3 py-1.5 text-[11px] font-bold uppercase text-on-surface-variant hover:text-on-surface rounded-sm';
    });
    btn.className = 'px-3 py-1.5 text-[11px] font-bold uppercase text-primary bg-primary/10 rounded-sm';
    
    const stance = btn.getAttribute('data-stance');
    demoStance = stance;
  });
});

// Web Serial hardware link
document.getElementById('btn-link-arduino').addEventListener('click', connectArduinoSerial);

// Collapsible Hardware Debug Console Drawer event binding
document.getElementById('btn-toggle-serial-console').addEventListener('click', () => toggleSerialConsole());

// Clear serial logs listener
document.getElementById('btn-clear-console-logs').addEventListener('click', (e) => {
  e.stopPropagation();
  const terminal = document.getElementById('serial-terminal-logs');
  if (terminal) {
    terminal.innerHTML = '<div class="text-on-surface-variant opacity-60">// Debug Console logs cleared. Waiting for telemetry data...</div>';
    e.target.classList.add('hidden');
  }
});

// Interactive Troubleshooting Modal open & close event bindings
document.getElementById('btn-troubleshoot-help').addEventListener('click', () => toggleTroubleshootingModal(true));
document.getElementById('btn-close-troubleshoot').addEventListener('click', () => toggleTroubleshootingModal(false));
document.getElementById('btn-close-troubleshoot-footer').addEventListener('click', () => toggleTroubleshootingModal(false));

// Hook Baud Rate Selector changes to debug console
const baudSelectEl = document.getElementById('serial-baud-rate');
if (baudSelectEl) {
  baudSelectEl.addEventListener('change', (e) => {
    appendConsoleLog("SYSTEM", `Baud rate target updated to ${e.target.value} bps.`);
    if (serialConnected) {
      appendConsoleLog("SYSTEM", "⚠️ Active stream running. Re-link device to apply the new speed.");
    }
  });
}

// --- LIGHT HOVER FOLLOW EFFECT CONTROLLER ---
document.addEventListener('mousemove', (e) => {
  const panels = document.querySelectorAll('.glass-panel');
  const x = e.clientX;
  const y = e.clientY;
  
  panels.forEach(panel => {
    const rect = panel.getBoundingClientRect();
    const localX = x - rect.left;
    const localY = y - rect.top;
    panel.style.setProperty('--x', `${localX}px`);
    panel.style.setProperty('--y', `${localY}px`);
  });
});

// --- APPLICATION START BOOTSTRAP ---
updateDashboardTelemetry();
renderLiveSessionTimeline();
switchTab('live');
