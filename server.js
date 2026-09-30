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

// Helper to resolve Organization / Tenant ID
function getOrgId(req) {
  const raw = req.headers['x-org-id'] || req.query.orgId || req.body?.orgId || 'sk_enterprises';
  return String(raw).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'sk_enterprises';
}

// -------------------------------------------------------------
// REST API ROUTES FOR LIVE MULTI-DEVICE SYNC & RBAC AUTH
// -------------------------------------------------------------

// 1. Health & Server Status
app.get('/api/health', (req, res) => {
  const orgId = getOrgId(req);
  const db = getDatabase(orgId);
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    serverTime: new Date().toISOString(),
    orgId,
    lastUpdated: db.lastUpdated || null,
  });
});

// 1b. Server Authentication Endpoint (Blinkit style Universal Multi-Tenant Login)
app.post('/api/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    const orgId = getOrgId(req);
    const db = getDatabase(orgId);

    const idClean = String(identifier || '').trim().toLowerCase();
    const passClean = String(password || '').trim();

    if (!idClean || !passClean) {
      return res.status(400).json({ success: false, message: "Login ID aur Password dono darj karein." });
    }

    // A. Check Admin / HR Account
    const adminCreds = db.adminCreds || { id: 'admin', password: '1234', email: 'admin@company.com' };
    const isAdminId = (
      idClean === 'admin' ||
      idClean === (adminCreds.id || '').toLowerCase() ||
      idClean === (adminCreds.email || '').toLowerCase() ||
      idClean === 'hr' ||
      idClean === 'owner'
    );

    if (isAdminId) {
      if (passClean === (adminCreds.password || '1234')) {
        return res.json({
          success: true,
          role: 'admin',
          orgId,
          companyName: db.config?.companyName || "SK ENTERPRISES",
          user: {
            id: 'admin',
            name: `${db.config?.companyName || "SK ENTERPRISES"} Owner / Admin`,
            role: 'Company Administrator',
            accessLevel: 'admin',
            email: adminCreds.email || 'admin@company.com',
            phone: '+91 98765 43210'
          }
        });
      } else {
        return res.status(401).json({ success: false, message: "Galat Admin Password darj kiya gaya hai." });
      }
    }

    // B. Check Employee / Supervisor Accounts
    const cleanPhone = idClean.replace(/[^0-9]/g, '');
    const matched = (db.employees || []).find(e => 
      e.id?.toLowerCase() === idClean ||
      e.email?.toLowerCase() === idClean ||
      e.loginId?.toLowerCase() === idClean ||
      e.name?.toLowerCase() === idClean ||
      (cleanPhone && String(e.phone || '').replace(/[^0-9]/g, '') === cleanPhone)
    );

    if (matched) {
      const validPass = String(matched.password || matched.pin || '1234');
      if (passClean === validPass) {
        const role = matched.accessLevel || 'employee';
        return res.json({
          success: true,
          role,
          orgId,
          companyName: db.config?.companyName || "SK ENTERPRISES",
          user: matched
        });
      } else {
        return res.status(401).json({ success: false, message: `Galat password/PIN darj kiya gaya hai.` });
      }
    }

    return res.status(404).json({ 
      success: false, 
      message: "User ID nahi mila. Kripya apna Employee ID ya Phone check karein ya Admin se sampark karein." 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1c. Update User PIN / Password
app.post('/api/auth/pin', async (req, res) => {
  try {
    const { empId, newPin } = req.body;
    const orgId = getOrgId(req);
    if (!empId || !newPin) {
      return res.status(400).json({ success: false, error: "empId and newPin are required" });
    }

    const updated = await updateDatabase((current) => {
      const employees = (current.employees || []).map(e => {
        if (e.id === empId) {
          return { ...e, password: String(newPin).trim(), pin: String(newPin).trim() };
        }
        return e;
      });
      return { ...current, employees };
    }, orgId);

    res.json({ success: true, message: "PIN updated successfully", employees: updated.employees });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1d. Update User Role (RBAC: Employee <-> Manager <-> Admin)
app.post('/api/auth/role', async (req, res) => {
  try {
    const { empId, newRole } = req.body;
    const orgId = getOrgId(req);
    if (!empId || !newRole) {
      return res.status(400).json({ success: false, error: "empId and newRole are required" });
    }

    const updated = await updateDatabase((current) => {
      const employees = (current.employees || []).map(e => {
        if (e.id === empId) {
          return { ...e, accessLevel: newRole };
        }
        return e;
      });
      return { ...current, employees };
    }, orgId);

    res.json({ success: true, message: "Role updated successfully", employees: updated.employees });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Full Sync Endpoint: Single network trip for all devices
app.get('/api/sync', (req, res) => {
  try {
    const orgId = getOrgId(req);
    const db = getDatabase(orgId);
    res.json({
      success: true,
      orgId,
      employees: db.employees || [],
      attendance: db.attendance || {},
      leaves: db.leaves || [],
      advances: db.advances || [],
      expenses: db.expenses || [],
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
    const orgId = getOrgId(req);
    const { employees, attendance, leaves, advances, expenses, config, adminCreds } = req.body;
    
    const updated = await updateDatabase((current) => ({
      ...current,
      employees: employees !== undefined ? employees : current.employees,
      attendance: attendance !== undefined ? attendance : current.attendance,
      leaves: leaves !== undefined ? leaves : current.leaves,
      advances: advances !== undefined ? advances : current.advances,
      expenses: expenses !== undefined ? expenses : (current.expenses || []),
      config: config !== undefined ? config : current.config,
      adminCreds: adminCreds !== undefined ? adminCreds : current.adminCreds,
    }), orgId);

    res.json({
      success: true,
      orgId,
      lastUpdated: updated.lastUpdated,
      message: "Server database synchronized successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Employee Management
app.get('/api/employees', (req, res) => {
  const orgId = getOrgId(req);
  const db = getDatabase(orgId);
  res.json(db.employees || []);
});

app.post('/api/employees', async (req, res) => {
  try {
    const orgId = getOrgId(req);
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
    }, orgId);

    res.json({ success: true, employees: updated.employees, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { id } = req.params;
    const updated = await updateDatabase((current) => ({
      ...current,
      employees: (current.employees || []).filter(e => e.id !== id),
    }), orgId);
    res.json({ success: true, employees: updated.employees, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Attendance Punches & Log
app.get('/api/attendance', (req, res) => {
  const orgId = getOrgId(req);
  const db = getDatabase(orgId);
  res.json(db.attendance || {});
});

app.post('/api/attendance/punch', async (req, res) => {
  try {
    const orgId = getOrgId(req);
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
    }, orgId);

    res.json({ success: true, attendance: updated.attendance, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance/batch', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { attendance } = req.body;
    const updated = await updateDatabase((current) => ({
      ...current,
      attendance: {
        ...(current.attendance || {}),
        ...(attendance || {}),
      },
    }), orgId);
    res.json({ success: true, attendance: updated.attendance, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Leave Requests
app.get('/api/leaves', (req, res) => {
  const orgId = getOrgId(req);
  const db = getDatabase(orgId);
  res.json(db.leaves || []);
});

app.post('/api/leaves', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const leaveReq = req.body;
    const updated = await updateDatabase((current) => ({
      ...current,
      leaves: [leaveReq, ...(current.leaves || [])],
    }), orgId);
    res.json({ success: true, leaves: updated.leaves, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leaves/:id', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { id } = req.params;
    const { status } = req.body;
    const updated = await updateDatabase((current) => ({
      ...current,
      leaves: (current.leaves || []).map(l => l.id === id ? { ...l, status } : l),
    }), orgId);
    res.json({ success: true, leaves: updated.leaves, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Salary Advances
app.get('/api/advances', (req, res) => {
  const orgId = getOrgId(req);
  const db = getDatabase(orgId);
  res.json(db.advances || []);
});

app.post('/api/advances', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const advance = req.body;
    const updated = await updateDatabase((current) => ({
      ...current,
      advances: [advance, ...(current.advances || [])],
    }), orgId);
    res.json({ success: true, advances: updated.advances, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/advances/:id', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { id } = req.params;
    const updated = await updateDatabase((current) => ({
      ...current,
      advances: (current.advances || []).filter(a => a.id !== id),
    }), orgId);
    res.json({ success: true, advances: updated.advances, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7b. Site Expenses & Allowances (Kharcha / Batta / Travel)
app.get('/api/expenses', (req, res) => {
  const orgId = getOrgId(req);
  const db = getDatabase(orgId);
  res.json(db.expenses || []);
});

app.post('/api/expenses', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const expense = req.body;
    if (!expense.id) {
      expense.id = `EXP-${Date.now()}`;
    }
    const updated = await updateDatabase((current) => ({
      ...current,
      expenses: [expense, ...(current.expenses || [])],
    }), orgId);
    res.json({ success: true, expenses: updated.expenses, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { id } = req.params;
    const updated = await updateDatabase((current) => ({
      ...current,
      expenses: (current.expenses || []).filter(e => e.id !== id),
    }), orgId);
    res.json({ success: true, expenses: updated.expenses, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Company Configuration & Admin Creds
app.get('/api/config', (req, res) => {
  const orgId = getOrgId(req);
  const db = getDatabase(orgId);
  res.json(db.config || {});
});

app.post('/api/config', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const newConfig = req.body;
    const updated = await updateDatabase((current) => ({
      ...current,
      config: { ...current.config, ...newConfig },
    }), orgId);
    res.json({ success: true, config: updated.config, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/creds', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const newCreds = req.body;
    const updated = await updateDatabase((current) => ({
      ...current,
      adminCreds: { ...current.adminCreds, ...newCreds },
    }), orgId);
    res.json({ success: true, lastUpdated: updated.lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Reset Demo Dataset & Wipe Clean
app.post('/api/reset-demo', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const updated = await resetToDemo(orgId);
    res.json({ success: true, data: updated, message: "Demo corporate data reloaded on server!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wipe-clean', async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const updated = await wipeToClean(orgId);
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

  // -------------------------------------------------------------
  // RENDER FREE TIER KEEP-ALIVE (Prevents service from sleeping)
  // -------------------------------------------------------------
  const RENDER_SERVICE_URL = process.env.RENDER_EXTERNAL_URL || 'https://attendance-manager-pro-02o2.onrender.com';
  setInterval(async () => {
    try {
      const healthUrl = `${RENDER_SERVICE_URL}/api/health`;
      const res = await fetch(healthUrl);
      if (res.ok) {
        console.log(`[Keep-Alive] Pinged ${healthUrl} successfully at ${new Date().toISOString()}`);
      }
    } catch (err) {
      // Silent catch
    }
  }, 13 * 60 * 1000); // Self-ping every 13 mins (Render idle cutoff is 15 mins)
});
