import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { 
  initDatabase, 
  getDatabase, 
  updateDatabase, 
  resetToDemo, 
  wipeToClean 
} from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all cross-origin requests
app.use(cors());

// Parse JSON with 50MB limit to handle local JPG/PNG avatar uploads smoothly
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize persistent server database
await initDatabase();

// -------------------------------------------------------------
// REST API ROUTES FOR LIVE MULTI-DEVICE SYNC
// -------------------------------------------------------------

// 1. Health & Server Status
app.get('/api/health', (req, res) => {
  const db = getDatabase();
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    serverTime: new Date().toISOString(),
    lastUpdated: db.lastUpdated || null,
  });
});

// 2. Full Sync Endpoint: Single network trip for all devices
app.get('/api/sync', (req, res) => {
  try {
    const db = getDatabase();
    res.json({
      success: true,
      employees: db.employees || [],
      attendance: db.attendance || {},
      leaves: db.leaves || [],
      advances: db.advances || [],
      config: db.config || {},
      adminCreds: db.adminCreds || {},
      lastUpdated: db.lastUpdated || new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Instant Push / Delta Sync Endpoint
app.post('/api/sync', async (req, res) => {
  try {
    const { employees, attendance, leaves, advances, config, adminCreds } = req.body;
    
    const updated = await updateDatabase((current) => ({
      ...current,
      employees: employees !== undefined ? employees : current.employees,
      attendance: attendance !== undefined ? attendance : current.attendance,
      leaves: leaves !== undefined ? leaves : current.leaves,
      advances: advances !== undefined ? advances : current.advances,
      config: config !== undefined ? config : current.config,
      adminCreds: adminCreds !== undefined ? adminCreds : current.adminCreds,
    }));

    res.json({
      success: true,
      lastUpdated: updated.lastUpdated,
      message: "Server database synchronized successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Employee Management
app.get('/api/employees', (req, res) => {
  const db = getDatabase();
  res.json(db.employees || []);
});

app.post('/api/employees', async (req, res) => {
  try {
    const newEmp = req.body;
    if (!newEmp.id || !newEmp.name) {
      return res.status(400).json({ error: "Employee ID and Name are required" });
    }

    const updated = await updateDatabase((current) => {
      const existingIdx = (current.employees || []).findIndex(e => e.id === newEmp.id);
      let employees = [...(current.employees || [])];
      if (existingIdx >= 0) {
        employees[existingIdx] = { ...employees[existingIdx], ...newEmp };
      } else {
        employees.push(newEmp);
      }
      return { ...current, employees };
    });

    res.json({ success: true, employees: updated.employees, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateDatabase((current) => ({
      ...current,
      employees: (current.employees || []).filter(e => e.id !== id),
    }));
    res.json({ success: true, employees: updated.employees, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Attendance Punches & Log
app.get('/api/attendance', (req, res) => {
  const db = getDatabase();
  res.json(db.attendance || {});
});

app.post('/api/attendance/punch', async (req, res) => {
  try {
    const { date, empId, punchData } = req.body;
    if (!date || !empId) {
      return res.status(400).json({ error: "date and empId are required" });
    }

    const updated = await updateDatabase((current) => {
      const attendance = { ...(current.attendance || {}) };
      if (!attendance[date]) attendance[date] = {};
      attendance[date][empId] = {
        ...(attendance[date][empId] || {}),
        ...punchData,
      };
      return { ...current, attendance };
    });

    res.json({ success: true, attendance: updated.attendance, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance/batch', async (req, res) => {
  try {
    const { attendance } = req.body;
    const updated = await updateDatabase((current) => ({
      ...current,
      attendance: {
        ...(current.attendance || {}),
        ...(attendance || {}),
      },
    }));
    res.json({ success: true, attendance: updated.attendance, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Leave Requests
app.get('/api/leaves', (req, res) => {
  const db = getDatabase();
  res.json(db.leaves || []);
});

app.post('/api/leaves', async (req, res) => {
  try {
    const leaveReq = req.body;
    const updated = await updateDatabase((current) => ({
      ...current,
      leaves: [leaveReq, ...(current.leaves || [])],
    }));
    res.json({ success: true, leaves: updated.leaves, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leaves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await updateDatabase((current) => ({
      ...current,
      leaves: (current.leaves || []).map(l => l.id === id ? { ...l, status } : l),
    }));
    res.json({ success: true, leaves: updated.leaves, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Salary Advances
app.get('/api/advances', (req, res) => {
  const db = getDatabase();
  res.json(db.advances || []);
});

app.post('/api/advances', async (req, res) => {
  try {
    const advance = req.body;
    const updated = await updateDatabase((current) => ({
      ...current,
      advances: [advance, ...(current.advances || [])],
    }));
    res.json({ success: true, advances: updated.advances, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/advances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateDatabase((current) => ({
      ...current,
      advances: (current.advances || []).filter(a => a.id !== id),
    }));
    res.json({ success: true, advances: updated.advances, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Company Configuration & Admin Creds
app.get('/api/config', (req, res) => {
  const db = getDatabase();
  res.json(db.config || {});
});

app.post('/api/config', async (req, res) => {
  try {
    const newConfig = req.body;
    const updated = await updateDatabase((current) => ({
      ...current,
      config: { ...current.config, ...newConfig },
    }));
    res.json({ success: true, config: updated.config, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/creds', async (req, res) => {
  try {
    const newCreds = req.body;
    const updated = await updateDatabase((current) => ({
      ...current,
      adminCreds: { ...current.adminCreds, ...newCreds },
    }));
    res.json({ success: true, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Reset Demo Dataset & Wipe Clean
app.post('/api/reset-demo', async (req, res) => {
  try {
    const updated = await resetToDemo();
    res.json({ success: true, data: updated, message: "Demo corporate data reloaded on server!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wipe-clean', async (req, res) => {
  try {
    const updated = await wipeToClean();
    res.json({ success: true, data: updated, message: "Server database wiped clean!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// STATIC ASSET SERVING FOR PRODUCTION (RENDER WEB SERVICE)
// -------------------------------------------------------------
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback for HTML5 History API (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
} else {
  app.get('/', (req, res) => {
    res.send('AttendFlow Server running! (Run `npm run build` to generate frontend static dist bundle).');
  });
}

// Start Server on 0.0.0.0 for Cloud Hosting Compatibility
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🚀 AttendFlow Cloud Server Running on port ${PORT}`);
  console.log(`📡 Multi-Device Sync Active`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
