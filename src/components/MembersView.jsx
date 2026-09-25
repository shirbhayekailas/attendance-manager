import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Download, 
  Edit2, 
  Trash2, 
  Eye, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  Clock, 
  X,
  CreditCard,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Lock,
  Shield,
  Check,
  FileText,
  Sparkles,
  Upload,
  Camera,
  Image as ImageIcon,
  IndianRupee
} from 'lucide-react';
import { calculateEmployeeStats, calculateStatutoryComponents } from '../utils/attendanceCalculations';
import { getEmployeeTotalAdvance } from '../utils/storage';
import SalaryAdvanceModal from './SalaryAdvanceModal';

export default function MembersView({ 
  employees, 
  setEmployees, 
  attendance, 
  advances = [],
  setAdvances,
  config = {}, 
  setConfig,
  onSelectEmployee, 
  onSaveToast 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [editingEmployee, setEditingEmployee] = useState(null); // 'new' | employee object
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceTargetEmployee, setAdvanceTargetEmployee] = useState(null);
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptInput, setCustomDeptInput] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: 'Software Engineer',
    department: 'Engineering',
    email: '',
    phone: '',
    salaryBase: '₹85,000',
    salaryMonthly: 85000,
    shift: '09:30 AM - 06:30 PM',
    avatar: '',
    accessLevel: 'employee', // 'employee' | 'manager' | 'admin'
    loginId: '',
    password: '1234',
    statutoryType: 'pf_esic', // 'pf_esic' | 'non_pf_esic'
    uanNo: '',
    esicNo: '',
  });

  // Dynamically merge config departments with existing employee departments
  const availableDepartments = Array.from(new Set([
    ...(config.departments || [
      'Engineering', 
      'Design', 
      'Human Resources', 
      'Sales & Growth', 
      'Finance', 
      'Operations', 
      'Marketing', 
      'Product'
    ]),
    ...employees.map(e => e.department).filter(Boolean)
  ])).filter(Boolean);

  const departments = ['All', ...availableDepartments];

  // Calculate stats for all employees
  const employeeListWithStats = employees.map((emp) => ({
    ...emp,
    stats: calculateEmployeeStats(emp.id, attendance),
  }));

  // Filtering
  const filteredEmployees = employeeListWithStats.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    const matchesRole = selectedRoleFilter === 'All' || (emp.accessLevel || 'employee') === selectedRoleFilter;
    return matchesSearch && matchesDept && matchesRole;
  });

  const handleOpenAdd = () => {
    const nextIdNum = employees.length + 101;
    const nextId = `EMP-${nextIdNum}`;
    const defaultDept = availableDepartments[0] || 'Engineering';
    setIsCustomDept(false);
    setCustomDeptInput('');
    setFormData({
      id: nextId,
      name: '',
      role: 'Staff Specialist',
      department: defaultDept,
      email: '',
      phone: '',
      salaryBase: '₹15,000',
      salaryMonthly: 15000,
      shift: config.shiftStart && config.shiftEnd ? `${config.shiftStart} - ${config.shiftEnd}` : '09:30 AM - 06:30 PM',
      avatar: '',
      accessLevel: 'employee',
      loginId: nextId,
      password: '1234',
      statutoryType: 'pf_esic',
      uanNo: '',
      esicNo: '',
    });
    setEditingEmployee('new');
  };

  const handleOpenEdit = (emp) => {
    const empDept = emp.department || 'Engineering';
    const isKnown = availableDepartments.includes(empDept);
    const empSalary = emp.salaryMonthly || parseInt(String(emp.salaryBase || '15000').replace(/[^0-9]/g, ''), 10) || 15000;
    setIsCustomDept(!isKnown);
    setCustomDeptInput(isKnown ? '' : empDept);
    setFormData({
      id: emp.id,
      name: emp.name,
      role: emp.role || '',
      department: empDept,
      email: emp.email || '',
      phone: emp.phone || '',
      salaryBase: emp.salaryBase || `₹${empSalary.toLocaleString('en-IN')}`,
      salaryMonthly: empSalary,
      shift: emp.shift || '09:30 AM - 06:30 PM',
      avatar: emp.avatar || '',
      accessLevel: emp.accessLevel || 'employee',
      loginId: emp.loginId || emp.id,
      password: emp.password || emp.pin || '1234',
      statutoryType: emp.statutoryType || 'pf_esic',
      uanNo: emp.uanNo || '',
      esicNo: emp.esicNo || '',
    });
    setEditingEmployee(emp);
  };

  // Direct JPG / PNG File Upload Handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|jpg|webp)$/i)) {
      alert("Invalid format! Please upload a valid JPG or PNG image file.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert("Image is larger than 3MB. Please select a JPG or PNG image under 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      if (base64Data) {
        setFormData(prev => ({
          ...prev,
          avatar: base64Data
        }));
        onSaveToast(`Photo loaded: ${file.name} (${Math.round(file.size / 1024)} KB)!`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.id.trim()) {
      alert("Name and EMP ID are required.");
      return;
    }

    const finalDept = (isCustomDept ? customDeptInput.trim() : formData.department.trim()) || 'General';

    // Auto-persist newly typed custom department to global company config
    if (finalDept && setConfig && config) {
      const currentDepts = config.departments || availableDepartments;
      if (!currentDepts.includes(finalDept)) {
        setConfig({
          ...config,
          departments: [...currentDepts, finalDept]
        });
      }
    }

    const numSalary = parseInt(String(formData.salaryBase).replace(/[^0-9]/g, ''), 10) || 15000;
    const finalAvatar = formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'Staff')}&background=0284c7&color=fff&bold=true`;

    const payload = {
      ...formData,
      department: finalDept,
      salaryMonthly: numSalary,
      statutoryType: formData.statutoryType || 'pf_esic',
      uanNo: formData.uanNo || '',
      esicNo: formData.esicNo || '',
      avatar: finalAvatar,
    };

    if (editingEmployee === 'new') {
      if (employees.some(e => e.id.toLowerCase() === payload.id.toLowerCase())) {
        alert("This Employee ID already exists! Please use a unique ID.");
        return;
      }
      const newEmp = {
        ...payload,
        loginId: payload.loginId || payload.id,
        password: payload.password || '1234',
        pin: payload.password || '1234',
        joinDate: new Date().toISOString().split('T')[0],
        leaveBalance: { cl: 8, sl: 5, pl: 12 },
      };
      setEmployees([...employees, newEmp]);
      onSaveToast(`Created ${payload.name} (${payload.accessLevel.toUpperCase()} • ${finalDept} • ${payload.statutoryType === 'non_pf_esic' ? 'Non-PF' : 'PF & ESIC'})!`);
    } else {
      setEmployees(employees.map(e => e.id === editingEmployee.id ? { 
        ...e, 
        ...payload,
        loginId: payload.loginId || payload.id,
        password: payload.password || '1234',
        pin: payload.password || '1234',
      } : e));
      onSaveToast(`Updated profile & statutory settings for ${payload.name}`);
    }

    setEditingEmployee(null);
  };

  const handleDelete = (emp) => {
    if (window.confirm(`Are you sure you want to remove ${emp.name} (${emp.id}) from the company directory?`)) {
      setEmployees(employees.filter(e => e.id !== emp.id));
      onSaveToast(`Removed ${emp.name} from directory.`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['EMP ID', 'Name', 'Department', 'Role/Designation', 'Access Role', 'Login ID', 'Password/PIN', 'Basic Salary', 'Email', 'Phone', 'Payable Days', 'Attendance %'];
    const rows = filteredEmployees.map(e => [
      `"${e.id}"`,
      `"${e.name}"`,
      `"${e.department}"`,
      `"${e.role}"`,
      `"${e.accessLevel || 'employee'}"`,
      `"${e.loginId || e.id}"`,
      `"${e.password || e.pin || '1234'}"`,
      `"${e.salaryBase}"`,
      `"${e.email}"`,
      `"${e.phone}"`,
      e.stats.payableDays,
      e.stats.attendanceRate,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `staff_directory_access_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSaveToast("Exported Staff Access & Directory CSV!");
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>Staff Directory & Access Control</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Onboard employees, configure system access levels (Admin / Manager / Employee), and manage login credentials.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setAdvanceTargetEmployee(null);
              setIsAdvanceModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-md shadow-amber-500/30 transition-all"
            title="Record employee advance payment and view advance ledger"
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Record Advance</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Export Roster CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md shadow-blue-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, EMP ID, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          >
            {departments.map((d) => (
              <option key={d} value={d}>Department: {d}</option>
            ))}
          </select>
        </div>

        {/* Role / Access Level Filter */}
        <div>
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          >
            <option value="All">All Access Roles</option>
            <option value="employee">Role: Employee (Self-Service)</option>
            <option value="manager">Role: Manager / Supervisor</option>
            <option value="admin">Role: HR Administrator</option>
          </select>
        </div>
      </div>

      {/* Employee Cards Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {employees.length === 0 ? "No Staff Registered Yet" : "No Matching Staff Found"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {employees.length === 0 
                ? "Your corporate staff directory is clean. Click below to create your first employee or manager login."
                : "Try adjusting your search query or role filter."}
            </p>
          </div>
          {employees.length === 0 && (
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create First Staff Login</span>
            </button>
          )}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const access = emp.accessLevel || 'employee';
          return (
            <div
              key={emp.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700/60 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={emp.avatar} 
                      alt={emp.name} 
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {emp.name}
                      </h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{emp.id}</span>
                        <span>•</span>
                        <span>{emp.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Access Level Badge & Statutory Badge */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      access === 'admin' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
                      access === 'manager'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {access === 'admin' ? '🛡️ Admin' : access === 'manager' ? '💼 Manager' : '👤 Employee'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      emp.statutoryType === 'non_pf_esic'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {emp.statutoryType === 'non_pf_esic' ? 'Non-PF' : 'PF & ESIC'}
                    </span>
                    {(() => {
                      const empAdv = getEmployeeTotalAdvance(emp.id, advances);
                      if (empAdv > 0) {
                        return (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                            -₹{empAdv.toLocaleString('en-IN')} Adv
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* Login Credentials Box */}
                <div className="mt-3 p-2.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-mono text-[11px]">
                    <KeyRound className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>ID: <strong className="text-slate-900 dark:text-white font-bold">{emp.loginId || emp.id}</strong></span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    PIN: <strong className="text-slate-900 dark:text-white font-bold">{emp.password || emp.pin || '1234'}</strong>
                  </div>
                </div>

                {/* Role & Base Salary */}
                <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Designation</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{emp.role}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Payable Days</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{emp.stats.payableDays} Days</span>
                  </div>
                </div>

                {/* Attendance metrics */}
                <div className="mt-2.5 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-400 block">In-Office</span>
                    <span className="font-bold text-slate-900 dark:text-white">{emp.stats.inOffice}d</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-400 block">WFH</span>
                    <span className="font-bold text-slate-900 dark:text-white">{emp.stats.wfh}d</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-400 block">Leaves</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{emp.stats.paidLeave}d</span>
                  </div>
                </div>

                {/* Contacts */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {emp.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  )}
                  {emp.shift && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Shift: {emp.shift}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectEmployee(emp)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 rounded-xl transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Dossier</span>
                  </button>
                  <button
                    onClick={() => {
                      setAdvanceTargetEmployee(emp);
                      setIsAdvanceModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 rounded-xl transition-colors"
                    title={`Record Advance for ${emp.name}`}
                  >
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Advance</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(emp)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit profile & login password"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(emp)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                    title="Remove user"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Add / Edit Employee Modal - Landscape Widescreen Layout */}
      {editingEmployee && (
        <div className="no-print fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl xl:max-w-6xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Landscape Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                    <span>{editingEmployee === 'new' ? 'New Staff Onboarding & Master Setup' : 'Edit Staff Profile & Access Permissions'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold uppercase">
                      Landscape Layout
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure employee identity, portal login credentials, monthly basic salary, and statutory PF/ESIC schemes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Landscape Form Content (2 Columns Grid) */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* ================= LEFT COLUMN: IDENTITY & LOGIN ACCESS ================= */}
                <div className="space-y-4">
                  
                  {/* Card 1: System Portal Access & Login Role */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/40 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-black text-blue-950 dark:text-blue-200 uppercase tracking-wide">
                          1. Portal Access &amp; Privileges
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono">
                        Role-Based Access
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Assigned Portal Role / Privileges *
                      </label>
                      <select
                        value={formData.accessLevel}
                        onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
                        className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold cursor-pointer shadow-sm"
                      >
                        <option value="employee">👤 Employee (Personal Punch IN/OUT &amp; My Leaves)</option>
                        <option value="manager">💼 Manager / Supervisor (Team Attendance Roster &amp; Leave Approvals)</option>
                        <option value="admin">🛡️ HR Administrator (Full Company Master Console Access)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Portal Login ID *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.loginId || formData.id}
                          onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                          placeholder="e.g. EMP-101"
                          className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Login Password / PIN *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="e.g. 1234"
                          className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Staff Details & Organization */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                        2. Identity &amp; Organization Details
                      </span>
                    </div>

                    {/* ID & Name */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Employee Code / ID *
                        </label>
                        <input
                          type="text"
                          required
                          disabled={editingEmployee !== 'new'}
                          value={formData.id}
                          onChange={(e) => setFormData({ ...formData, id: e.target.value, loginId: formData.loginId || e.target.value })}
                          placeholder="e.g. EMP-101"
                          className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Department & Role */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                            Department *
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const next = !isCustomDept;
                              setIsCustomDept(next);
                              if (next) {
                                setCustomDeptInput(formData.department || '');
                              }
                            }}
                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            {isCustomDept ? '← Select' : '+ Custom'}
                          </button>
                        </div>

                        {isCustomDept ? (
                          <div>
                            <input
                              type="text"
                              autoFocus
                              required
                              value={customDeptInput}
                              onChange={(e) => {
                                setCustomDeptInput(e.target.value);
                                setFormData({ ...formData, department: e.target.value });
                              }}
                              placeholder="Type new dept..."
                              className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border-2 border-blue-500 text-slate-900 dark:text-white font-bold"
                            />
                            <span className="text-[9.5px] text-blue-600 dark:text-blue-400 font-medium block mt-0.5">
                              ✓ Auto-saved to company list
                            </span>
                          </div>
                        ) : (
                          <select
                            value={formData.department}
                            onChange={(e) => {
                              if (e.target.value === '__add_new__') {
                                setIsCustomDept(true);
                                setCustomDeptInput('');
                              } else {
                                setFormData({ ...formData, department: e.target.value });
                              }
                            }}
                            className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                          >
                            {availableDepartments.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                            <option value="__add_new__" className="text-blue-600 font-bold bg-blue-50 dark:bg-blue-950">
                              + Add Custom Department...
                            </option>
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Designation / Job Title
                        </label>
                        <input
                          type="text"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          placeholder="e.g. Senior Frontend Dev"
                          className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Work Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="emp@company.com"
                          className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Shift & Employee Photo (JPG / PNG Direct File Upload) */}
                    <div className="space-y-3 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Shift Schedule
                        </label>
                        <input
                          type="text"
                          value={formData.shift}
                          onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                          placeholder="09:30 AM - 06:30 PM"
                          className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Photo Upload Card */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Employee Photo (JPG / PNG File)
                          </label>
                          <span className="text-[10px] text-slate-400">
                            JPG, PNG, WEBP (Max 3MB)
                          </span>
                        </div>

                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                          {/* Photo Thumbnail Preview */}
                          <div className="relative shrink-0">
                            {formData.avatar ? (
                              <img
                                src={formData.avatar}
                                alt="Employee Photo Preview"
                                className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700/70 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400">
                                <Camera className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                          </div>

                          {/* File Actions */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <label
                                htmlFor="employee-avatar-upload"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-blue-600/25 transition-all active:scale-95"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{formData.avatar ? 'Change Photo (JPG/PNG)' : 'Upload Photo (JPG/PNG)'}</span>
                              </label>

                              {formData.avatar && (
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, avatar: '' })}
                                  className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                                  title="Remove photo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {formData.avatar 
                                ? '✓ Custom photo loaded (saved directly to employee record)' 
                                : 'Upload employee passport or profile photo from device'}
                            </p>

                            {/* Hidden Native File Input */}
                            <input
                              id="employee-avatar-upload"
                              type="file"
                              accept="image/jpeg,image/png,image/jpg,image/webp"
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* ================= RIGHT COLUMN: SALARY & STATUTORY PF/ESIC ================= */}
                <div className="space-y-4">
                  
                  {/* Card 3: Basic Salary Setup */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                          3. Monthly Basic Salary
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Base = Basic (100%)
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Basic Monthly Salary (INR) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.salaryBase}
                        onChange={(e) => setFormData({ ...formData, salaryBase: e.target.value })}
                        placeholder="e.g. ₹15,000"
                        className="w-full p-3 text-sm font-mono font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-sm"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Base Salary aur Basic Salary ek hi hai. PF (12%) aur ESIC (0.75%) is poore basic wage par calculate hoga.
                      </p>
                    </div>
                  </div>

                  {/* Card 4: Statutory Scheme Selection (PF & ESIC vs Non-PF & Non-ESIC) */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                          4. Statutory Benefits &amp; Compliance Scheme
                        </span>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        formData.statutoryType === 'non_pf_esic'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {formData.statutoryType === 'non_pf_esic' ? 'Non-PF & Non-ESIC' : 'PF & ESIC Applicable'}
                      </span>
                    </div>

                    {/* Two Selectable Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, statutoryType: 'pf_esic' })}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          formData.statutoryType !== 'non_pf_esic'
                            ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            ✓ PF &amp; ESIC
                          </span>
                          <span className={`w-3 h-3 rounded-full ${formData.statutoryType !== 'non_pf_esic' ? 'bg-blue-600' : 'border border-slate-300'}`}></span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                          EPF: 12% of Basic (max ₹1,800) • ESIC: 0.75% Gross (if &le; ₹21k)
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, statutoryType: 'non_pf_esic' })}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          formData.statutoryType === 'non_pf_esic'
                            ? 'bg-amber-50/80 dark:bg-amber-950/50 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            ✓ Non-PF &amp; Non-ESIC
                          </span>
                          <span className={`w-3 h-3 rounded-full ${formData.statutoryType === 'non_pf_esic' ? 'bg-amber-500' : 'border border-slate-300'}`}></span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                          Exempt / No PF or ESIC deductions (Gross direct payout)
                        </p>
                      </button>
                    </div>

                    {/* Real-time Calculation Breakdown Preview */}
                    {(() => {
                      const numSalary = parseInt(String(formData.salaryBase).replace(/[^0-9]/g, ''), 10) || 0;
                      const stat = calculateStatutoryComponents(numSalary, formData.statutoryType);
                      const netTakeHome = Math.max(0, stat.grossEarnings - stat.epf - stat.esic);

                      return (
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            <span>Basic Monthly Wage:</span>
                            <span className="font-mono text-slate-900 dark:text-white">₹{stat.basic.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">EPF Deduction (12% of Basic):</span>
                            <span className={`font-mono font-bold ${stat.epf > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {stat.epf > 0 ? `-₹${stat.epf.toLocaleString('en-IN')}` : '₹0 (Exempt)'}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">ESIC Deduction (0.75% of Gross):</span>
                            <span className={`font-mono font-bold ${stat.esic > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {stat.esic > 0 
                                ? `-₹${stat.esic.toLocaleString('en-IN')}` 
                                : (formData.statutoryType === 'non_pf_esic' ? '₹0 (Exempt)' : '₹0 (Gross > ₹21,000 limit)')}
                            </span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex justify-between font-black text-slate-900 dark:text-white">
                            <span>Estimated Net Base Take-Home:</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400">
                              ₹{netTakeHome.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Optional UAN & ESIC Numbers if PF & ESIC is selected */}
                    {formData.statutoryType !== 'non_pf_esic' && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                            PF / UAN Number (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.uanNo || ''}
                            onChange={(e) => setFormData({ ...formData, uanNo: e.target.value })}
                            placeholder={`e.g. 1014892019${formData.id.replace(/\D/g, '') || '28'}`}
                            className="w-full p-2 text-xs font-mono rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                            ESIC IP Number (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.esicNo || ''}
                            onChange={(e) => setFormData({ ...formData, esicNo: e.target.value })}
                            placeholder={`e.g. 3100849201${formData.id.replace(/\D/g, '') || '12'}`}
                            className="w-full p-2 text-xs font-mono rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                  </div>

                </div>

              </div>

              {/* Landscape Footer Toolbar */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Target:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formData.name || 'New Employee'}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    {formData.id || 'EMP-???'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingEmployee(null)}
                    className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingEmployee === 'new' ? 'Save & Create Employee Login' : 'Update Profile & Permissions'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Employee Salary Advance Modal */}
      {isAdvanceModalOpen && (
        <SalaryAdvanceModal
          isOpen={isAdvanceModalOpen}
          onClose={() => {
            setIsAdvanceModalOpen(false);
            setAdvanceTargetEmployee(null);
          }}
          employees={employees}
          initialEmployee={advanceTargetEmployee}
          advances={advances}
          setAdvances={setAdvances}
          onSaveToast={onSaveToast}
        />
      )}

    </div>
  );
}
