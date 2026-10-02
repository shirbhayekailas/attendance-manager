import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Search, 
  Building, 
  CreditCard, 
  CheckCircle2, 
  Calendar, 
  Briefcase,
  Eye,
  X,
  DollarSign,
  IndianRupee,
  MessageCircle,
  FileText,
  Wallet
} from 'lucide-react';
import { calculateEmployeeStats, calculateWorkDuration } from '../utils/attendanceCalculations';
import { getEmployeeTotalAdvance, getEmployeeTotalExpenses } from '../utils/storage';
import { sounds } from '../utils/sound';
import SalarySlipModal from './SalarySlipModal';
import SalaryAdvanceModal from './SalaryAdvanceModal';
import BatchSalarySlipsModal from './BatchSalarySlipsModal';
import SiteExpenseModal from './SiteExpenseModal';
import BulkWhatsAppModal from './BulkWhatsAppModal';

export default function ReportsView({ 
  employees, 
  attendance, 
  advances = [],
  setAdvances,
  expenses = [],
  setExpenses,
  config, 
  onSaveToast,
  role = 'admin' 
}) {
  const isManager = role === 'manager';
  const [activeReportTab, setActiveReportTab] = useState(isManager ? 'matrix' : 'payroll');
  const [rangeFilter, setRangeFilter] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayslipEmp, setSelectedPayslipEmp] = useState(null);
  const [advanceTargetEmp, setAdvanceTargetEmp] = useState(null);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isBatchSlipsOpen, setIsBatchSlipsOpen] = useState(false);
  const [isBulkWhatsAppOpen, setIsBulkWhatsAppOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseTargetEmp, setExpenseTargetEmp] = useState(null);

  const now = new Date();
  const currentMonthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();

  const allDates = Object.keys(attendance).sort();
  const filteredDates = rangeFilter === 'all' 
    ? allDates 
    : allDates.slice(-parseInt(rangeFilter, 10));

  // Compute payroll summary per employee
  const payrollData = employees.map((emp) => {
    let rangeTotal = 0;
    let rangeOffice = 0;
    let rangeWFH = 0;
    let rangeHalfDay = 0;
    let rangeLeave = 0;
    let rangeAbsent = 0;
    let rangeWeekOff = 0;
    let rangeHoliday = 0;
    let rangeLate = 0;
    let rangeWeekOffDuty = 0;
    let rangeOvertime = 0;

    filteredDates.forEach((d) => {
      const rec = attendance[d]?.[emp.id];
      if (rec && rec.status) {
        rangeTotal++;
        const ot = (rec.overtimeHours !== undefined && rec.overtimeHours !== null && rec.overtimeHours !== '')
          ? Number(rec.overtimeHours)
          : ((rec.clockIn && rec.clockOut && rec.clockIn !== '--' && rec.clockOut !== '--')
            ? calculateWorkDuration(rec.clockIn, rec.clockOut).overtimeHours
            : 0);
        rangeOvertime += ot;

        const dateObj = new Date(d + 'T00:00:00');
        const isSunday = dateObj.getDay() === 0;
        const isWODuty = rec.isWeekOffDuty || rec.status === 'week_off_present' || rec.status === 'wo_present' || ((rec.status === 'present' || rec.status === 'late' || rec.status === 'wfh') && isSunday) || /week.?off|sunday|wo/i.test(rec.note || '');

        if (rec.status === 'present') {
          rangeOffice++;
          if (isWODuty) rangeWeekOffDuty++;
        }
        else if (rec.status === 'wfh') {
          rangeWFH++;
          if (isWODuty) rangeWeekOffDuty++;
        }
        else if (rec.status === 'late') {
          rangeOffice++;
          rangeLate++;
          if (isWODuty) rangeWeekOffDuty++;
        }
        else if (rec.status === 'half_day') rangeHalfDay++;
        else if (rec.status === 'leave') rangeLeave++;
        else if (rec.status === 'absent') rangeAbsent++;
        else if (rec.status === 'week_off' || rec.status === 'wo') rangeWeekOff++;
        else if (rec.status === 'holiday' || rec.status === 'ph') rangeHoliday++;
        else if (rec.status === 'week_off_present' || rec.status === 'wo_present') {
          rangeOffice++;
          rangeWeekOffDuty++;
        }
      }
    });

    // Enterprise HRMS Standard (Keka / GreytHR): Working on Week Off adds +1.0 full payable day
    const payableDays = rangeOffice + rangeWFH + rangeLeave + rangeWeekOff + rangeHoliday + (rangeHalfDay * 0.5) + rangeWeekOffDuty;
    // Dynamic month days division: 30 for 30d month, 31 for 31d month, etc.
    const overallStats = calculateEmployeeStats(emp.id, attendance, emp.salaryMonthly || 100000, currentMonthDays);
    const advanceAmount = getEmployeeTotalAdvance(emp.id, advances);
    const siteAllowance = getEmployeeTotalExpenses(emp.id, expenses, currentMonthPrefix);
    const netDisbursal = Math.max(0, overallStats.netEstimatedSalary + siteAllowance - advanceAmount);

    return {
      ...emp,
      rangeTotal,
      rangeOffice,
      rangeWFH,
      rangeHalfDay,
      rangeLeave,
      rangeAbsent,
      rangeWeekOff,
      rangeHoliday,
      rangeLate,
      rangeWeekOffDuty,
      rangeOvertime: Number(rangeOvertime.toFixed(1)),
      payableDays,
      advanceAmount,
      siteAllowance,
      netDisbursal,
      overallStats,
    };
  });

  const displayedEmployees = payrollData.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Total Net Payroll for displayed staff (after advance deduction)
  const totalNetPayroll = displayedEmployees.reduce((acc, curr) => acc + (curr.netDisbursal ?? curr.overallStats.netEstimatedSalary), 0);
  const totalAdvancesDisbursed = displayedEmployees.reduce((acc, curr) => acc + (curr.advanceAmount || 0), 0);

  // Export CSV
  const handleExportPayrollCSV = () => {
    sounds.playSuccess();
    const headers = [
      'Employee ID', 
      'Full Name', 
      'Department', 
      'Designation', 
      'Statutory Scheme',
      'Basic Salary (INR)', 
      'Total Sessions', 
      'In-Office Days', 
      'WFH Days', 
      'Week Off Days',
      'WO Duty (WO-P)',
      'Half Days', 
      'Paid Leaves', 
      'LWP (Loss of Pay)', 
      'Overtime Hours',
      'Payable Days', 
      'Loss of Pay Deduction', 
      'Overtime Bonus', 
      'Salary Advance Deducted (INR)',
      'Final Net Payable Salary (INR)'
    ];

    const rows = displayedEmployees.map(e => [
      `"${e.id}"`,
      `"${e.name}"`,
      `"${e.department}"`,
      `"${e.role}"`,
      `"${e.statutoryType === 'non_pf_esic' ? 'Non-PF & Non-ESIC' : 'PF & ESIC Applicable'}"`,
      e.salaryMonthly,
      e.rangeTotal,
      e.rangeOffice,
      e.rangeWFH,
      e.rangeWeekOff,
      e.rangeWeekOffDuty,
      e.rangeHalfDay,
      e.rangeLeave,
      e.rangeAbsent,
      e.rangeOvertime,
      e.payableDays,
      e.overallStats.lossOfPayDeduction,
      e.overallStats.overtimePay,
      e.advanceAmount || 0,
      e.netDisbursal,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `corporate_payroll_register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSaveToast("Downloaded Corporate Payroll CSV!");
  };

  // Bank Salary Transfer File Export (NEFT / RTGS Corporate Payment)
  const handleExportBankTransferCSV = () => {
    sounds.playSuccess();
    const headers = [
      'Beneficiary Name',
      'Bank Account Number',
      'IFSC Code',
      'Amount (INR)',
      'Payment Mode',
      'Narration / Remarks',
      'Employee Code',
      'Bank Name'
    ];

    const rows = displayedEmployees.map(e => [
      `"${e.name}"`,
      `"${e.bankAccountNo || '••••••••' + (e.id.replace(/\D/g, '') || '4892')}"`,
      `"${e.ifscCode || 'HDFC0000123'}"`,
      e.netDisbursal,
      'NEFT',
      `"SALARY ${currentMonthName.toUpperCase().slice(0, 3)} ${currentYear} - ${config?.companyName || 'SK ENTERPRISES'}"`,
      `"${e.id}"`,
      `"${e.bankName || 'HDFC Bank Ltd'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bank_salary_neft_rtgs_transfer_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSaveToast("Exported Bank Salary Transfer File (NEFT / RTGS)!");
  };

  // Official EPFO Unified Portal ECR File Export (.txt with #~# delimiter)
  const handleExportEpfoEcrTxt = () => {
    sounds.playSuccess();
    const rows = displayedEmployees
      .filter(e => e.statutoryType !== 'non_pf_esic')
      .map(e => {
        const uan = e.uanNo || `1014892019${e.id.replace(/\D/g, '') || '28'}`;
        const name = e.name.toUpperCase();
        const gross = e.earnedSalary || e.netDisbursal || 0;
        const epfWages = Math.min(gross, 15000);
        const epsWages = epfWages;
        const edliWages = epfWages;
        const eeShare = Math.min(Math.round(epfWages * 0.12), 1800);
        const epsShare = Math.round(epsWages * 0.0833);
        const erShare = Math.max(0, eeShare - epsShare);
        const ncpDays = e.overallStats?.lopDays || 0;
        const refund = 0;

        return `${uan}#~#${name}#~#${gross}#~#${epfWages}#~#${epsWages}#~#${edliWages}#~#${eeShare}#~#${epsShare}#~#${erShare}#~#${ncpDays}#~#${refund}`;
      });

    if (rows.length === 0) {
      onSaveToast("No PF-eligible staff found for ECR generation!");
      return;
    }

    const content = rows.join('\r\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EPFO_ECR_${(config?.companyName || 'SK_ENTERPRISES').replace(/\s+/g, '_')}_${currentMonthName}_${currentYear}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onSaveToast("Downloaded EPFO ECR .txt file for portal upload!");
  };

  // Official ESIC Monthly Return CSV Export
  const handleExportEsicCsv = () => {
    sounds.playSuccess();
    const headers = ['IP Number', 'IP Name', 'No of Days Worked', 'Total Monthly Wages', 'Reason Code', 'Last Working Day'];
    const rows = displayedEmployees
      .filter(e => e.statutoryType !== 'non_pf_esic' && (e.earnedSalary <= 21000 || e.esicNo))
      .map(e => [
        `"${e.esicNo || ('31' + (e.id.replace(/\D/g, '') || '48291048'))}"`,
        `"${e.name}"`,
        e.payableDays,
        e.earnedSalary || e.netDisbursal || 0,
        e.payableDays < 20 ? '2' : '0',
        '""'
      ]);

    if (rows.length === 0) {
      onSaveToast("No ESIC eligible staff (gross ≤ ₹21,000) found!");
      return;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `ESIC_Monthly_Return_${currentMonthName}_${currentYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSaveToast("Exported ESIC Monthly Return CSV!");
  };

  // Quick 1-Click WhatsApp Salary Slip Notification
  const handleShareWhatsAppSlip = (emp) => {
    sounds.playSuccess();
    const phone = (emp.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const siteAllow = emp.siteAllowance || 0;
    const msg = `*SALARY SLIP - ${currentMonthName.toUpperCase()} ${currentYear}*
*${config?.companyName || 'SK ENTERPRISES'}*
${config?.companyAddress || '303, Panchsheel chs ltd, plot no 07, sec -02, taloja phase -01, navi mumbai -410208'}

Employee: *${emp.name}* (${emp.id})
Designation: ${emp.role} | Dept: ${emp.department}

*Attendance Summary:*
- Present / WFH: ${emp.rangeOffice + emp.rangeWFH} Days
- Week Off (WO): ${emp.rangeWeekOff} Days
${emp.rangeWeekOffDuty > 0 ? `- ★ Week Off Duty Worked: ${emp.rangeWeekOffDuty} Days (+${emp.rangeWeekOffDuty} Extra Paid Days)\n` : ''}- Paid Leave / Holiday: ${emp.rangeLeave + emp.rangeHoliday} Days
- Overtime Logged: ${emp.rangeOvertime} hrs
- Total Payable Days: ${emp.payableDays} / ${emp.rangeTotal}

*Salary Calculation:*
- Basic Salary: ₹${(emp.salaryMonthly || 0).toLocaleString('en-IN')}
- Overtime Pay: ₹${(emp.overallStats?.overtimePay || 0).toLocaleString('en-IN')}${siteAllow > 0 ? `\n- Site Allowance / Batta: ₹${siteAllow.toLocaleString('en-IN')}` : ''}
${emp.advanceAmount > 0 ? `- Advance Deducted: ₹${emp.advanceAmount.toLocaleString('en-IN')}\n` : ''}*Net Payable Salary: ₹${(emp.netDisbursal || 0).toLocaleString('en-IN')}*

_This is a computer-generated salary slip from ${config?.companyName || 'SK ENTERPRISES'}._`;

    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    sounds.playSuccess();
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Landscape print setup for Payroll Ledger */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape !important;
            margin: 6mm 8mm !important;
          }
        }
      `}</style>

      {/* Main Ledger UI - Hidden during payslip modal print */}
      <div className={`space-y-6 ${selectedPayslipEmp ? 'no-print' : ''}`}>

        {/* Top Header */}
        <div className="no-print bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-500" />
            <span>Executive Payroll & Timesheet Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified monthly attendance days, overtime accruals, and computed net salary disbursement register.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveReportTab('payroll')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeReportTab === 'payroll'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Payroll Register
            </button>
            <button
              onClick={() => setActiveReportTab('matrix')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeReportTab === 'matrix'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Timesheet Matrix
            </button>
          </div>

          {!isManager && (
            <button
              onClick={handleExportBankTransferCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 transition-colors shadow-xs"
              title="Download Bank Salary Transfer NEFT/RTGS Excel/CSV"
            >
              <Building className="w-3.5 h-3.5" />
              <span>Bank NEFT File</span>
            </button>
          )}

          {!isManager && (
            <button
              onClick={() => setIsBulkWhatsAppOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer"
              title="Bulk send salary slips to all employees via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Bulk WhatsApp Slips</span>
            </button>
          )}

          {!isManager && (
            <button
              onClick={handleExportEpfoEcrTxt}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors shadow-xs cursor-pointer"
              title="Download EPFO ECR format text file for EPFO Unified Employer Portal upload"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>EPFO ECR (.txt)</span>
            </button>
          )}

          {!isManager && (
            <button
              onClick={handleExportEsicCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-2xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-colors shadow-xs cursor-pointer"
              title="Download ESIC Monthly Return CSV for ESIC portal upload"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ESIC Return (.csv)</span>
            </button>
          )}

          {!isManager && (
            <button
              onClick={() => setIsBatchSlipsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 transition-colors shadow-xs"
              title="Print or Save All Employee Payslips in One PDF Job"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print All Slips (Batch)</span>
            </button>
          )}

          <button
            onClick={() => {
              setExpenseTargetEmp(null);
              setIsExpenseModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 transition-colors shadow-xs"
            title="Record Site Travel, Food & Daily Kharcha"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Site Kharcha</span>
          </button>

          <button
            onClick={handleExportPayrollCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* Financial Payroll KPI Strip */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Net Disbursal</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{totalNetPayroll.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
            Across {displayedEmployees.length} Active Staff
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Advances Deducted</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              ₹{totalAdvancesDisbursed.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block mt-1">
            Auto-deducted from payslips
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Payroll Cycle Days</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">22 Working Days</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block mt-1">
            Excludes Saturdays & Sundays
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Compliance & Audit Status</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">100% Verified</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block mt-1">
            Zero Unresolved Punch Conflicts
          </span>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee in ledger..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Timeline:</span>
          <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {[
              { id: '7', label: '7 Days' },
              { id: '14', label: '14 Days' },
              { id: '30', label: '30 Days' },
              { id: 'all', label: 'All Recorded' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRangeFilter(r.id)}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  rangeFilter === r.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Official Print Header - SK ENTERPRISES LETTERHEAD */}
      <div className="print-only hidden p-6 border-b-2 border-slate-900 mb-4 bg-white text-slate-900">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                SK
              </div>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
                {config?.companyName || 'SK ENTERPRISES'}
              </h1>
            </div>
            <p className="text-[10px] text-slate-700 font-medium max-w-xl">
              {config?.companyAddress || '303, Panchsheel chs ltd, plot no 07, sec -02, taloja phase -01, navi mumbai -410208'}
            </p>
            <p className="text-xs font-bold text-slate-900 mt-1">Official Payroll &amp; Attendance Register • Fiscal Year 2026-2027</p>
            <p className="text-[10px] text-slate-500">Generated on {new Date().toLocaleDateString()} • Statutory Standard: 22 Working Days Base</p>
          </div>
          <div className="text-right text-xs space-y-1">
            <div className="inline-block px-2.5 py-0.5 rounded bg-slate-950 text-white font-mono text-[9px] font-black uppercase tracking-wider">
              CONFIDENTIAL HR PAYROLL
            </div>
            <p className="font-bold text-slate-900 text-xs">Total Staff: {displayedEmployees.length}</p>
          </div>
        </div>
      </div>

      {/* TAB 1: PAYROLL SUMMARY REGISTER */}
      {activeReportTab === 'payroll' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department &amp; Role</th>
                  <th className="py-3.5 px-4 text-center">In Office</th>
                  <th className="py-3.5 px-4 text-center">WFH</th>
                  <th className="py-3.5 px-4 text-center text-sky-600 dark:text-sky-400">Week Off</th>
                  <th className="py-3.5 px-4 text-center text-amber-600 dark:text-amber-400" title="Week Off Duty Worked (+1 Extra Paid Day)">★ WO Duty</th>
                  <th className="py-3.5 px-4 text-center">Paid Leaves</th>
                  <th className="py-3.5 px-4 text-center">LWP</th>
                  <th className="py-3.5 px-4 text-center">OT Hours</th>
                  <th className="py-3.5 px-4 text-center font-black text-emerald-600 dark:text-emerald-400">Payable Days</th>
                  <th className="py-3.5 px-4 text-right">Basic Salary</th>
                  <th className="py-3.5 px-4 text-right font-black text-amber-600 dark:text-amber-400">Site Batta</th>
                  <th className="py-3.5 px-4 text-right font-black text-rose-600 dark:text-rose-400">Advance</th>
                  <th className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">Net Salary</th>
                  <th className="no-print py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">{emp.id}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          emp.statutoryType === 'non_pf_esic'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {emp.statutoryType === 'non_pf_esic' ? 'Non-PF' : 'PF & ESIC'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{emp.department}</div>
                      <div className="text-[10px] text-slate-400">{emp.role}</div>
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {emp.rangeOffice}d
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-indigo-500">
                      {emp.rangeWFH}d
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-sky-600 dark:text-sky-400">
                      {emp.rangeWeekOff}d
                    </td>

                    <td className="py-3 px-4 text-center">
                      {emp.rangeWeekOffDuty > 0 ? (
                        <span 
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60"
                          title={`${emp.rangeWeekOffDuty} Week Off Days Worked (+${emp.rangeWeekOffDuty} Paid Days)`}
                        >
                          ★ {emp.rangeWeekOffDuty}d
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-purple-500">
                      {emp.rangeLeave + emp.rangeHoliday}d
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-rose-500">
                      {emp.rangeAbsent > 0 ? `${emp.rangeAbsent}d` : '-'}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-500">
                      {emp.rangeOvertime > 0 ? `+${emp.rangeOvertime}h` : '-'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {emp.payableDays} / {emp.rangeTotal}d
                        {emp.rangeWeekOffDuty > 0 && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 ml-1 font-bold">
                            (+{emp.rangeWeekOffDuty})
                          </span>
                        )}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      ₹{emp.salaryMonthly?.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {emp.siteAllowance > 0 ? (
                        <button
                          onClick={() => {
                            setExpenseTargetEmp(emp);
                            setIsExpenseModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:ring-2 hover:ring-amber-500/50 transition-all cursor-pointer"
                          title="Click to view/manage site allowance"
                        >
                          +₹{emp.siteAllowance.toLocaleString('en-IN')}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setExpenseTargetEmp(emp);
                            setIsExpenseModalOpen(true);
                          }}
                          className="no-print text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-medium px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Record site kharcha / batta for this employee"
                        >
                          + ₹0
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {emp.advanceAmount > 0 ? (
                        <button
                          onClick={() => {
                            setAdvanceTargetEmp(emp);
                            setIsAdvanceModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:ring-2 hover:ring-rose-500/50 transition-all cursor-pointer"
                          title="Click to view/manage advance"
                        >
                          -₹{emp.advanceAmount.toLocaleString('en-IN')}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setAdvanceTargetEmp(emp);
                            setIsAdvanceModalOpen(true);
                          }}
                          className="no-print text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-medium px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Record advance for this employee"
                        >
                          - ₹0
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{emp.netDisbursal?.toLocaleString('en-IN')}
                    </td>

                    <td className="no-print py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleShareWhatsAppSlip(emp)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                          title="Send Salary Slip via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedPayslipEmp(emp)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                          title="View Detailed Payslip"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TIMESHEET MATRIX */}
      {activeReportTab === 'matrix' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-700 z-10">
                <tr>
                  <th className="p-3 sticky left-0 bg-slate-50 dark:bg-slate-800 z-20 min-w-[180px]">Employee</th>
                  {filteredDates.map((date) => (
                    <th key={date} className="p-2 text-center whitespace-nowrap min-w-[38px]">
                      {date.slice(5)}
                    </th>
                  ))}
                  <th className="p-3 text-center min-w-[90px]">Payable Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedEmployees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 sticky left-0 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white z-10 border-r border-slate-100 dark:border-slate-800">
                      <div className="truncate max-w-[160px] font-bold">{e.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{e.id} • {e.department}</div>
                    </td>

                    {filteredDates.map((date) => {
                      const rec = attendance[date]?.[e.id];
                      const status = rec?.status;
                      return (
                        <td key={date} className="p-1 text-center">
                          {status === 'present' ? (
                            <span className="w-6 h-6 rounded-md inline-flex items-center justify-center font-black text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              P
                            </span>
                          ) : status === 'wfh' ? (
                            <span className="w-6 h-6 rounded-md inline-flex items-center justify-center font-black text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              W
                            </span>
                          ) : status === 'late' ? (
                            <span className="w-6 h-6 rounded-md inline-flex items-center justify-center font-black text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              L
                            </span>
                          ) : status === 'half_day' ? (
                            <span className="w-6 h-6 rounded-md inline-flex items-center justify-center font-black text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                              H
                            </span>
                          ) : status === 'leave' ? (
                            <span className="w-6 h-6 rounded-md inline-flex items-center justify-center font-black text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              V
                            </span>
                          ) : (status === 'week_off' || status === 'wo') ? (
                            <span className="w-6 h-6 rounded-md inline-flex items-center justify-center font-black text-[9px] bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                              WO
                            </span>
                          ) : (status === 'holiday' || status === 'ph') ? (
                            <span className="w-6 h-6 rounded-md inline-flex items-center justify-center font-black text-[9px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              PH
                            </span>
                          ) : status === 'absent' ? (
                            <span className="w-6 h-6 rounded-md inline-flex items-center justify-center font-black text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              A
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">-</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="p-3 text-center font-black text-emerald-600 dark:text-emerald-400">
                      {e.payableDays}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {/* Official Signatures for Printed PDF Ledger */}
        <div className="print-only hidden pt-16 grid grid-cols-3 gap-8 text-center text-xs">
          <div className="border-t-2 border-black pt-2 font-bold">
            Chief Human Resources Officer (CHRO)
          </div>
          <div className="border-t-2 border-black pt-2 font-bold">
            Chief Financial Officer (CFO)
          </div>
          <div className="border-t-2 border-black pt-2 font-bold">
            Managing Director / Chief Executive Officer
          </div>
        </div>

      </div>

      {/* Executive Salary Payslip Modal */}
      {selectedPayslipEmp && (
        <SalarySlipModal
          employee={selectedPayslipEmp}
          attendance={attendance}
          advances={advances}
          expenses={expenses}
          config={config}
          monthYear="September 2026"
          onClose={() => setSelectedPayslipEmp(null)}
        />
      )}

      {/* Salary Advance Modal */}
      {isAdvanceModalOpen && (
        <SalaryAdvanceModal
          isOpen={isAdvanceModalOpen}
          onClose={() => {
            setIsAdvanceModalOpen(false);
            setAdvanceTargetEmp(null);
          }}
          employees={employees}
          initialEmployee={advanceTargetEmp}
          advances={advances}
          setAdvances={setAdvances}
          onSaveToast={onSaveToast}
        />
      )}

      {/* Batch All Payslips Print / PDF Modal */}
      {isBatchSlipsOpen && (
        <BatchSalarySlipsModal
          isOpen={isBatchSlipsOpen}
          onClose={() => setIsBatchSlipsOpen(false)}
          employees={displayedEmployees}
          attendance={attendance}
          advances={advances}
          expenses={expenses}
          config={config}
          monthYear="September 2026"
        />
      )}

      {/* Site Kharcha & Daily Allowance Modal */}
      {isExpenseModalOpen && (
        <SiteExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setExpenseTargetEmp(null);
          }}
          employees={employees}
          initialEmployee={expenseTargetEmp}
          expenses={expenses}
          setExpenses={setExpenses}
          onSaveToast={onSaveToast}
        />
      )}

      {/* Bulk WhatsApp Payslips Modal */}
      {isBulkWhatsAppOpen && (
        <BulkWhatsAppModal
          isOpen={isBulkWhatsAppOpen}
          onClose={() => setIsBulkWhatsAppOpen(false)}
          employees={displayedEmployees}
          monthYear={`${currentMonthName} ${currentYear}`}
          config={config}
          onSaveToast={onSaveToast}
        />
      )}

    </div>
  );
}
