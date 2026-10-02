import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  MessageCircle, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Award, 
  TrendingUp, 
  ShieldAlert, 
  UserCheck, 
  Briefcase,
  Calendar,
  Building,
  ChevronRight,
  Copy,
  PenTool
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function HRLettersView({ employees = [], config, onSaveToast }) {
  const [letterType, setLetterType] = useState('offer'); // 'offer' | 'experience' | 'increment' | 'verification' | 'warning'
  const [selectedEmpId, setSelectedEmpId] = useState(() => employees[0]?.id || '');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [revisedSalary, setRevisedSalary] = useState('');
  const [customRemarks, setCustomRemarks] = useState('');
  const [joiningDate, setJoiningDate] = useState('01 Apr 2026');
  const [relievingDate, setRelievingDate] = useState(() => new Date().toISOString().split('T')[0]);

  const selectedEmp = employees.find(e => e.id === selectedEmpId) || employees[0] || {
    id: 'EMP-001',
    name: 'Sample Employee',
    role: 'Operations Specialist',
    department: 'Operations',
    salaryMonthly: 35000,
    phone: '9876543210',
    joinedDate: '2025-01-15'
  };

  const companyName = config?.companyName || 'SK ENTERPRISES';
  const companyAddress = config?.companyAddress || '303, Panchsheel chs ltd, plot no 07, sec -02, taloja phase -01, navi mumbai -410208';
  const currentYear = new Date().getFullYear();
  const refNo = `SK/HR/${currentYear}/${selectedEmp?.id?.replace(/[^a-zA-Z0-9]/g, '') || '001'}`;

  const monthlySal = Number(selectedEmp?.salaryMonthly) || 30000;
  const annualCTC = monthlySal * 12;
  const newMonthlySal = Number(revisedSalary) || Math.round(monthlySal * 1.15);
  const newAnnualCTC = newMonthlySal * 12;
  const incrementDiff = newMonthlySal - monthlySal;

  const letterTypes = [
    {
      id: 'offer',
      title: 'Offer of Employment',
      desc: 'Formal job offer with compensation package & joining terms',
      icon: Briefcase,
      badge: 'Onboarding',
      color: 'blue'
    },
    {
      id: 'experience',
      title: 'Experience & Relieving Certificate',
      desc: 'Official service certificate upon resignation / tenure completion',
      icon: Award,
      badge: 'Separation',
      color: 'purple'
    },
    {
      id: 'increment',
      title: 'Salary Appraisal & Increment Letter',
      desc: 'Annual CTC revision, revised gross & role promotion notice',
      icon: TrendingUp,
      badge: 'Appraisal',
      color: 'emerald'
    },
    {
      id: 'verification',
      title: 'Employment Verification Letter',
      desc: 'Official proof of employment for bank loans, passport & visa',
      icon: UserCheck,
      badge: 'Compliance',
      color: 'sky'
    },
    {
      id: 'warning',
      title: 'Show Cause & Attendance Warning',
      desc: 'Official advisory for unapproved absences, late punches or misconduct',
      icon: ShieldAlert,
      badge: 'Disciplinary',
      color: 'rose'
    }
  ];

  const handlePrint = () => {
    sounds.playSuccess();
    window.print();
  };

  const handleShareWhatsApp = () => {
    sounds.playSuccess();
    const phone = (selectedEmp?.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;

    let summaryText = '';
    if (letterType === 'offer') {
      summaryText = `*OFFER LETTER - ${companyName}*\nDear ${selectedEmp.name}, we are pleased to offer you the role of *${selectedEmp.role}* with a Monthly CTC of ₹${monthlySal.toLocaleString('en-IN')}. Reference: ${refNo}.`;
    } else if (letterType === 'experience') {
      summaryText = `*EXPERIENCE & RELIEVING CERTIFICATE*\nThis is to certify that ${selectedEmp.name} (${selectedEmp.id}) served as ${selectedEmp.role} with ${companyName}. Reference: ${refNo}.`;
    } else if (letterType === 'increment') {
      summaryText = `*SALARY INCREMENT LETTER - ${companyName}*\nCongratulations ${selectedEmp.name}! Your salary has been revised to ₹${newMonthlySal.toLocaleString('en-IN')}/month (+₹${incrementDiff.toLocaleString('en-IN')}). Reference: ${refNo}.`;
    } else if (letterType === 'verification') {
      summaryText = `*EMPLOYMENT VERIFICATION CERTIFICATE*\nIssued to ${selectedEmp.name} (${selectedEmp.id}), designated as ${selectedEmp.role} at ${companyName}. Reference: ${refNo}.`;
    } else {
      summaryText = `*OFFICIAL ADVISORY / WARNING NOTICE*\nDear ${selectedEmp.name}, please refer to the notice issued regarding attendance compliance. Reference: ${refNo}.`;
    }

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(summaryText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Print Setup for A4 Document */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 12mm 15mm !important;
          }
          .no-print {
            display: none !important;
          }
          .letter-canvas {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Top Header */}
      <div className="no-print bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Official Corporate HR Letter Studio
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate and print verified corporate HR letters on official SK ENTERPRISES letterhead with 1-click WhatsApp delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send WhatsApp</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official A4 Letter</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Letter Types & Controls on Left, Live Document Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Controls & Letter Templates */}
        <div className="no-print lg:col-span-5 space-y-4">
          
          {/* Template Selection Tabs */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              Select Letter Category
            </span>
            <div className="grid grid-cols-1 gap-2 pt-1">
              {letterTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = letterType === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      sounds.playSuccess();
                      setLetterType(item.id);
                    }}
                    className={`p-3 rounded-2xl text-left transition-all border flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500/80 shadow-xs'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{item.title}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-blue-600 translate-x-1' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Letter Configuration Inputs */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-blue-500" />
              <span>Recipient &amp; Letter Parameters</span>
            </h3>

            {/* Target Employee */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Select Staff Member
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id}) • {emp.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Issue Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Date of Letter
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {letterType === 'increment' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Effective From
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              )}

              {letterType === 'offer' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Joining Date
                  </label>
                  <input
                    type="text"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    placeholder="e.g. 15 Oct 2026"
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              )}

              {letterType === 'experience' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Relieving Date
                  </label>
                  <input
                    type="date"
                    value={relievingDate}
                    onChange={(e) => setRelievingDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Revised Salary if Increment */}
            {letterType === 'increment' && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Revised Monthly Salary (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={revisedSalary}
                    onChange={(e) => setRevisedSalary(e.target.value)}
                    placeholder={String(Math.round(monthlySal * 1.15))}
                    className="w-full pl-8 pr-4 py-2 text-xs font-mono font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  Current: ₹{monthlySal.toLocaleString('en-IN')}/mo • Proposed: ₹{newMonthlySal.toLocaleString('en-IN')}/mo (+₹{incrementDiff.toLocaleString('en-IN')})
                </p>
              </div>
            )}

            {/* Custom Notes / Specific Terms */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Custom Terms / Remarks (Optional)
              </label>
              <textarea
                value={customRemarks}
                onChange={(e) => setCustomRemarks(e.target.value)}
                rows={2}
                placeholder="Add any specific clause, probation period, or personal note..."
                className="w-full p-3 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Printable Document Sheet Canvas */}
        <div className="lg:col-span-7">
          <div className="letter-canvas bg-white text-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-300 shadow-xl min-h-[780px] flex flex-col justify-between font-serif text-[13px] leading-relaxed">
            
            {/* Header: Official SK ENTERPRISES Corporate Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-sm shrink-0">
                      SK
                    </div>
                    <h1 className="text-2xl font-black uppercase text-slate-950 tracking-tight font-sans">
                      {companyName}
                    </h1>
                  </div>
                  <p className="text-[11px] text-slate-700 font-sans font-medium max-w-lg">
                    {companyAddress}
                  </p>
                  <p className="text-[9.5px] text-slate-500 font-sans">
                    CIN: U72200MH2021PTC368412 • GSTIN: 27AABCT3920K1ZM • Contact: hr@skenterprises.com
                  </p>
                </div>

                <div className="text-right font-sans text-xs space-y-1">
                  <div className="inline-block px-3 py-1 rounded bg-slate-950 text-white text-[10px] font-black uppercase tracking-wider">
                    HUMAN RESOURCES DEPT
                  </div>
                  <p className="text-slate-500 text-[10px]">Date: <strong>{new Date(issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
                  <p className="text-slate-500 text-[10px] font-mono">Ref: <strong>{refNo}</strong></p>
                </div>
              </div>
            </div>

            {/* Letter Body: Dynamic Content by Type */}
            <div className="space-y-4 text-slate-800 flex-1">
              
              {/* Recipient Address */}
              <div className="font-sans text-xs space-y-0.5 mb-5">
                <p className="text-slate-400 font-bold uppercase text-[9px]">To,</p>
                <p className="font-black text-sm text-slate-900">{selectedEmp.name}</p>
                <p className="font-medium text-slate-700">Staff Code: {selectedEmp.id}</p>
                <p className="text-slate-600">{selectedEmp.role} • Department of {selectedEmp.department}</p>
                <p className="text-slate-500">{companyName}, Navi Mumbai, Maharashtra</p>
              </div>

              {/* 1. OFFER LETTER */}
              {letterType === 'offer' && (
                <div className="space-y-3">
                  <div className="text-center font-sans font-black text-sm uppercase underline decoration-2 underline-offset-4 text-slate-950 my-3">
                    SUB: FORMAL OFFER OF APPOINTMENT AS {selectedEmp.role.toUpperCase()}
                  </div>

                  <p>Dear <strong>{selectedEmp.name}</strong>,</p>
                  <p>
                    With reference to your recent application and subsequent rounds of interview with our executive team, we are pleased to offer you the position of <strong>{selectedEmp.role}</strong> in the <strong>{selectedEmp.department}</strong> department at <strong>{companyName}</strong>.
                  </p>
                  <p>
                    Your expected date of joining will be <strong>{joiningDate}</strong>. You shall be based at our head operations in Navi Mumbai.
                  </p>

                  <div className="my-3 border border-slate-300 rounded-lg p-3 bg-slate-50 font-sans text-xs space-y-1.5">
                    <p className="font-black uppercase tracking-wide text-slate-900 text-[10px]">Compensation &amp; Benefits Structure:</p>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div>Monthly Gross Salary: <strong>₹{monthlySal.toLocaleString('en-IN')}/-</strong></div>
                      <div>Annual Total CTC: <strong>₹{annualCTC.toLocaleString('en-IN')}/-</strong></div>
                      <div>Statutory Scheme: <strong>{selectedEmp.statutoryType === 'non_pf_esic' ? 'Exempt Scheme' : 'EPF + ESIC Covered'}</strong></div>
                      <div>Probation Period: <strong>3 Months from Joining</strong></div>
                    </div>
                  </div>

                  <p>
                    {customRemarks || 'You will be eligible for standard statutory benefits, company paid holidays, and week off allowances in accordance with company human resource policies.'}
                  </p>
                  <p>
                    Please confirm your acceptance of this appointment by signing and returning the duplicate copy of this letter within 7 days. We look forward to a mutually fruitful association.
                  </p>
                </div>
              )}

              {/* 2. EXPERIENCE CERTIFICATE */}
              {letterType === 'experience' && (
                <div className="space-y-3">
                  <div className="text-center font-sans font-black text-sm uppercase underline decoration-2 underline-offset-4 text-slate-950 my-3">
                    TO WHOMSOEVER IT MAY CONCERN: EXPERIENCE &amp; SERVICE CERTIFICATE
                  </div>

                  <p>
                    This is to formally certify that <strong>{selectedEmp.name}</strong> (Employee Code: <strong>{selectedEmp.id}</strong>) was employed with <strong>{companyName}</strong> as <strong>{selectedEmp.role}</strong> in the <strong>{selectedEmp.department}</strong> Department from <strong>{selectedEmp.joinedDate || '15 Jan 2025'}</strong> to <strong>{new Date(relievingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>.
                  </p>
                  <p>
                    During their tenure with us, {selectedEmp.name} demonstrated outstanding dedication, technical diligence, and team leadership. They fulfilled all key deliverables effectively and maintained exemplary workplace conduct and punctuality.
                  </p>
                  <p>
                    {customRemarks || 'All company assets, clearances, and financial accounts have been satisfactorily settled. We have no objection to them pursuing opportunities elsewhere.'}
                  </p>
                  <p>
                    We sincerely thank them for their contributions to <strong>{companyName}</strong> and wish them the very best in all their future personal and professional endeavors.
                  </p>
                </div>
              )}

              {/* 3. SALARY INCREMENT LETTER */}
              {letterType === 'increment' && (
                <div className="space-y-3">
                  <div className="text-center font-sans font-black text-sm uppercase underline decoration-2 underline-offset-4 text-slate-950 my-3">
                    ANNUAL PERFORMANCE APPRAISAL &amp; SALARY REVISION LETTER
                  </div>

                  <p>Dear <strong>{selectedEmp.name}</strong>,</p>
                  <p>
                    In recognition of your commendable performance, commitment, and valuable contribution towards organizational goals during the fiscal year, the management is delighted to revise your remuneration.
                  </p>

                  <div className="my-3 border border-slate-300 rounded-lg p-3 bg-slate-50 font-sans text-xs space-y-1.5">
                    <p className="font-black uppercase tracking-wide text-slate-900 text-[10px]">Revised Compensation Details:</p>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div>Previous Monthly Gross: <strong>₹{monthlySal.toLocaleString('en-IN')}</strong></div>
                      <div>Revised Monthly Gross: <strong className="text-emerald-700">₹{newMonthlySal.toLocaleString('en-IN')}</strong></div>
                      <div>Monthly Increment: <strong className="text-emerald-700">+₹{incrementDiff.toLocaleString('en-IN')}</strong></div>
                      <div>Revised Annual CTC: <strong>₹{newAnnualCTC.toLocaleString('en-IN')}</strong></div>
                    </div>
                  </div>

                  <p>
                    This revision will take effect from <strong>{new Date(effectiveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> and will be reflected in your upcoming payroll disbursal.
                  </p>
                  <p>
                    {customRemarks || 'We anticipate that you will continue to exhibit the same standard of diligence and inspire your colleagues as our enterprise enters its next growth phase.'}
                  </p>
                  <p>Congratulations and best wishes for continued success.</p>
                </div>
              )}

              {/* 4. EMPLOYMENT VERIFICATION */}
              {letterType === 'verification' && (
                <div className="space-y-3">
                  <div className="text-center font-sans font-black text-sm uppercase underline decoration-2 underline-offset-4 text-slate-950 my-3">
                    TO WHOMSOEVER IT MAY CONCERN: EMPLOYMENT &amp; RESIDENCE VERIFICATION
                  </div>

                  <p>
                    This is to confirm that <strong>{selectedEmp.name}</strong> (Employee ID: <strong>{selectedEmp.id}</strong>) is currently a permanent, full-time employee of <strong>{companyName}</strong>, working in the capacity of <strong>{selectedEmp.role}</strong> within the <strong>{selectedEmp.department}</strong> department.
                  </p>
                  <p>
                    According to company personnel records, they joined our organization on <strong>{selectedEmp.joinedDate || '15 Jan 2025'}</strong> and draw a current gross salary of <strong>₹{monthlySal.toLocaleString('en-IN')}/-</strong> per month (Annual CTC: ₹{annualCTC.toLocaleString('en-IN')}/-).
                  </p>
                  <p>
                    This letter is issued at the specific request of the employee for the purpose of <strong>{customRemarks || 'official verification, financial facilities, or banking formalities'}</strong> without any financial liability on the part of the company.
                  </p>
                </div>
              )}

              {/* 5. WARNING / SHOW CAUSE NOTICE */}
              {letterType === 'warning' && (
                <div className="space-y-3">
                  <div className="text-center font-sans font-black text-sm uppercase underline decoration-2 underline-offset-4 text-rose-700 my-3">
                    OFFICIAL ADVISORY &amp; SHOW CAUSE NOTICE: ATTENDANCE &amp; DISCIPLINE
                  </div>

                  <p>Dear <strong>{selectedEmp.name}</strong>,</p>
                  <p>
                    This notice is served regarding recent discrepancies noted in your shift compliance and attendance roster logs. As per company HR regulations, timely attendance and advance notification for absences are mandatory conditions of employment.
                  </p>
                  <p className="bg-rose-50 border border-rose-200 text-rose-950 p-2.5 rounded-lg text-xs font-sans">
                    <strong>Specific Concern:</strong> {customRemarks || 'Repeated unnotified absence / irregular shift reporting noted during the current attendance cycle.'}
                  </p>
                  <p>
                    You are hereby advised to submit a written explanation to the HR department within 48 hours of receipt of this notice, failing which appropriate administrative disciplinary action may be initiated under company standing orders.
                  </p>
                </div>
              )}

            </div>

            {/* Signature & Physical Stamp Footer */}
            <div className="border-t border-slate-300 pt-6 mt-6 font-sans text-xs">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="h-16"></div>
                  <div className="w-56 border-t border-slate-700 pt-1">
                    <p className="text-[11px] font-bold text-slate-900">Authorized Signatory</p>
                    <p className="text-[10px] text-slate-500">Director / Head of Human Resources</p>
                  </div>
                </div>

                <div className="text-right space-y-1 text-slate-400 text-[10px]">
                  <p>Computer Generated Document</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
