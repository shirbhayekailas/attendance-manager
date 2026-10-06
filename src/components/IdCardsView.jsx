import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import html2pdf from 'html2pdf.js';
import { 
  Contact, 
  Printer, 
  Download, 
  Search, 
  Building2, 
  ShieldCheck, 
  Phone, 
  Heart, 
  Calendar, 
  User, 
  Sparkles, 
  Layers, 
  RotateCw, 
  Check, 
  X, 
  Edit3, 
  Palette, 
  Grid, 
  CreditCard,
  QrCode as QrCodeIcon,
  Filter,
  Image as ImageIcon
} from 'lucide-react';
import { sounds } from '../utils/sound';

// Safe inline SVG avatar generator (100% immune to CORS taint & offline errors)
export function getInitialsSvgDataUri(name, bg = '#1e3a8a') {
  const parts = String(name || 'Staff').trim().split(/\s+/);
  const initials = parts.length >= 2 
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (name || 'SP').slice(0, 2).toUpperCase();
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="100%" height="100%" rx="24" fill="${encodeURIComponent(bg)}"/><text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="62" fill="%23ffffff" dominant-baseline="middle" text-anchor="middle">${initials}</text></svg>`;
}

export default function IdCardsView({ 
  employees = [], 
  setEmployees, 
  config = {}, 
  onSaveToast,
  initialEmpId = '' 
}) {
  const [selectedEmpId, setSelectedEmpId] = useState(() => initialEmpId || employees[0]?.id || '');
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'a4-sheet'
  const [sheetSide, setSheetSide] = useState('both'); // 'front' | 'back' | 'both'
  const [cardTheme, setCardTheme] = useState('navy'); // 'navy' | 'emerald' | 'crimson' | 'sapphire' | 'slate'
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Custom metadata for active employee (Blood Group, Emergency Contact)
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [qrCodeMap, setQrCodeMap] = useState({});
  const [mobilePreviewModal, setMobilePreviewModal] = useState(null);

  useEffect(() => {
    if (initialEmpId) {
      setSelectedEmpId(initialEmpId);
    }
  }, [initialEmpId]);

  const departments = ['All', ...new Set((employees || []).map(e => e?.department).filter(Boolean))];

  const filteredEmployees = (employees || []).filter(emp => {
    if (!emp) return false;
    const matchesSearch = (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (emp.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (emp.role || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const activeEmployee = (employees.length > 0 && employees.find(e => e.id === selectedEmpId)) || filteredEmployees[0] || employees[0] || null;

  useEffect(() => {
    if (activeEmployee) {
      setBloodGroup(activeEmployee.bloodGroup || 'B+');
      setEmergencyPhone(activeEmployee.emergencyPhone || activeEmployee.phone || '+91 98765 43210');
    }
  }, [activeEmployee?.id]);

  // Generate QR Codes for all employees (memoized with data hash to prevent continuous re-generation and CPU lag)
  const employeesHash = (employees || [])
    .map(e => `${e.id}_${e.name}_${e.role}_${e.bloodGroup || ''}_${e.emergencyPhone || e.phone || ''}`)
    .join(';');

  useEffect(() => {
    let isMounted = true;
    async function generateAllQRs() {
      const qrs = {};
      for (const emp of employees) {
        if (!emp?.id) continue;
        const payload = JSON.stringify({
          company: config.companyName || 'SK ENTERPRISES',
          empId: emp.id,
          name: emp.name,
          role: emp.role,
          dept: emp.department || 'Operations',
          blood: emp.bloodGroup || 'B+',
          emergency: emp.emergencyPhone || emp.phone || '9876543210',
          valid: 'VERIFIED_ACTIVE'
        });
        try {
          const url = await QRCode.toDataURL(payload, {
            width: 140,
            margin: 1,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });
          qrs[emp.id] = url;
        } catch (err) {
          console.error('Failed to generate QR code for', emp.id, err);
        }
      }
      if (isMounted) {
        setQrCodeMap(qrs);
      }
    }
    generateAllQRs();
    return () => { isMounted = false; };
  }, [employeesHash, config.companyName]);

  const handleSaveEmployeeMeta = () => {
    if (!activeEmployee) return;
    const updated = employees.map(e => {
      if (e.id === activeEmployee.id) {
        return {
          ...e,
          bloodGroup: bloodGroup.trim().toUpperCase(),
          emergencyPhone: emergencyPhone.trim()
        };
      }
      return e;
    });
    if (setEmployees) {
      setEmployees(updated);
    }
    setIsEditingMeta(false);
    sounds.playSuccess();
    onSaveToast(`Updated ID Card details for ${activeEmployee.name}`);
  };

  const handlePrint = () => {
    sounds.playSuccess();
    window.print();
  };

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  };

  const handleDownloadSinglePdf = async () => {
    if (!activeEmployee) return;
    try {
      sounds.playSuccess();
      setIsGeneratingPdf(true);
      const element = document.getElementById('printable-id-card-export') || document.getElementById('printable-single-id-card');
      if (!element) throw new Error('ID card element not found');

      const filename = `ID_Card_${activeEmployee.name.replace(/\s+/g, '_')}_${activeEmployee.id}.pdf`;
      const opt = {
        margin: [6, 6, 6, 6],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          allowTaint: true, 
          logging: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: 600
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 6000);

      onSaveToast(`ID Card PDF downloaded for ${activeEmployee.name}!`);
    } catch (err) {
      console.warn('PDF export error:', err);
      if (!isMobileDevice()) {
        window.print();
        onSaveToast('Print / Save as PDF opened as fallback');
      } else {
        onSaveToast('PDF generation failed on mobile. Tap "Image (PNG)" to save your card.');
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadSinglePng = async () => {
    if (!activeEmployee) return;
    try {
      sounds.playSuccess();
      setIsGeneratingPdf(true);
      const element = document.getElementById('printable-id-card-export') || document.getElementById('printable-single-id-card');
      if (!element) throw new Error('Card element not found');

      const worker = html2pdf().from(element).set({
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          allowTaint: true, 
          logging: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: 600
        }
      });
      const canvas = await worker.toCanvas();
      
      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
      });

      if (!blob) throw new Error('Canvas to Blob failed');

      const filename = `ID_Card_${activeEmployee.name.replace(/\s+/g, '_')}_${activeEmployee.id}.png`;
      const blobUrl = URL.createObjectURL(blob);

      // Open visual save & preview modal for mobile devices
      setMobilePreviewModal({
        url: blobUrl,
        blob: blob,
        filename: filename,
        employeeName: activeEmployee.name
      });

      // Also trigger browser file download via Blob URL
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
      }, 1500);

      onSaveToast(`ID Card image generated for ${activeEmployee.name}!`);
    } catch (err) {
      console.warn('PNG export error:', err);
      onSaveToast('Could not save image directly. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadBulkA4Pdf = async () => {
    try {
      sounds.playSuccess();
      setIsGeneratingPdf(true);
      const element = document.getElementById('printable-a4-sheet');
      if (!element) return;

      const filename = `Employee_ID_Cards_A4_Sheet_${new Date().toISOString().split('T')[0]}.pdf`;
      const opt = {
        margin: [4, 4, 4, 4],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 1.5, 
          useCORS: true, 
          allowTaint: true, 
          logging: false,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 6000);

      onSaveToast('Bulk ID Cards A4 Sheet PDF downloaded!');
    } catch (err) {
      console.warn('Bulk PDF error:', err);
      if (!isMobileDevice()) {
        window.print();
        onSaveToast('Print dialog opened as fallback');
      } else {
        onSaveToast('Bulk A4 download failed. Please use Single Preview.');
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Color theme palettes
  const themes = {
    navy: {
      name: 'Corporate Navy',
      headerBg: 'bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950',
      badgeBorder: 'border-blue-500/30',
      accentColor: 'text-blue-600 dark:text-blue-400',
      accentBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
      tagColor: 'bg-blue-600',
      ribbon: 'from-blue-600 to-indigo-600',
    },
    emerald: {
      name: 'Safety Emerald',
      headerBg: 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950',
      badgeBorder: 'border-emerald-500/30',
      accentColor: 'text-emerald-600 dark:text-emerald-400',
      accentBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      tagColor: 'bg-emerald-600',
      ribbon: 'from-emerald-600 to-teal-600',
    },
    crimson: {
      name: 'Executive Crimson',
      headerBg: 'bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950',
      badgeBorder: 'border-rose-500/30',
      accentColor: 'text-rose-600 dark:text-rose-400',
      accentBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
      tagColor: 'bg-rose-600',
      ribbon: 'from-rose-600 to-amber-600',
    },
    sapphire: {
      name: 'Royal Sapphire',
      headerBg: 'bg-gradient-to-r from-blue-900 via-sky-800 to-indigo-900',
      badgeBorder: 'border-sky-500/30',
      accentColor: 'text-sky-600 dark:text-sky-400',
      accentBg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
      tagColor: 'bg-sky-600',
      ribbon: 'from-blue-600 to-sky-500',
    },
    slate: {
      name: 'Industrial Graphite',
      headerBg: 'bg-gradient-to-r from-slate-900 via-zinc-900 to-neutral-900',
      badgeBorder: 'border-slate-500/30',
      accentColor: 'text-slate-700 dark:text-slate-300',
      accentBg: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200',
      tagColor: 'bg-slate-800',
      ribbon: 'from-slate-700 to-slate-900',
    }
  };

  const currentTheme = themes[cardTheme] || themes.navy;

  // Single ID Card Component (Front & Back)
  const renderIdCardFront = (emp, isPrint = false) => {
    if (!emp) return null;
    const fallbackAvatar = getInitialsSvgDataUri(emp.name);
    const hasLocalAvatar = emp.avatar && (emp.avatar.startsWith('data:') || emp.avatar.startsWith('blob:'));
    const avatarUrl = hasLocalAvatar ? emp.avatar : (emp.avatar || fallbackAvatar);
    return (
      <div 
        className={`w-[245px] h-[360px] rounded-2xl bg-white text-slate-900 shadow-xl overflow-hidden flex flex-col justify-between border border-slate-300 relative select-none ${isPrint ? 'print-card' : ''}`}
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* Top Header with Gradient & Company Identity */}
        <div className={`${currentTheme.headerBg} text-white px-3.5 pt-3 pb-2.5 text-center relative shrink-0`}>
          {/* Lanyard punch guide */}
          <div className="w-8 h-2.5 rounded-full border border-white/30 mx-auto mb-1.5 opacity-60"></div>
          
          <h2 className="text-[13px] font-black tracking-wider uppercase leading-tight line-clamp-1">
            {config.companyName || 'SK ENTERPRISES'}
          </h2>
          <p className="text-[9px] text-blue-200/90 font-medium tracking-wide uppercase mt-0.5">
            Staff Identity Card
          </p>
        </div>

        {/* Center Employee Identity Block */}
        <div className="px-3.5 pt-2 flex flex-col items-center flex-1">
          {/* Photo Frame */}
          <div className="relative mb-2">
            <div className={`w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white shadow-md border-2 border-slate-200 bg-slate-100 flex items-center justify-center`}>
              <img 
                src={avatarUrl} 
                alt={emp.name || 'Staff'} 
                className="w-full h-full object-cover"
                crossOrigin={avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) ? 'anonymous' : undefined}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = fallbackAvatar;
                }}
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" title="Verified Active Staff"></span>
          </div>

          {/* Name & Role */}
          <h3 className="text-sm font-black text-slate-900 tracking-tight text-center leading-tight line-clamp-1">
            {emp.name || 'Staff Member'}
          </h3>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md mt-0.5 max-w-[210px] truncate text-center">
            {emp.role || 'Corporate Staff'}
          </span>

          {/* Key Identification Attributes */}
          <div className="w-full mt-2.5 space-y-1 text-[10.5px] border-t border-slate-100 pt-2 text-left">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase text-[9px]">Employee ID</span>
              <span className="font-mono font-black text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">{emp.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase text-[9px]">Department</span>
              <span className="font-semibold text-slate-800 truncate max-w-[130px]">{emp.department || 'Operations'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase text-[9px]">Blood Group</span>
              <span className="font-bold text-rose-600 bg-rose-50 px-1.5 rounded text-[9.5px]">
                {emp.id === activeEmployee?.id ? bloodGroup : (emp.bloodGroup || 'B+')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase text-[9px]">DOJ (Joined)</span>
              <span className="font-mono font-bold text-slate-700 text-[9.5px]">
                {emp.joiningDate || emp.joinDate || 'Jan 2026'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase text-[9px]">Valid Upto</span>
              <span className="font-mono font-bold text-slate-700 text-[10px]">2028 • PERMANENT</span>
            </div>
          </div>
        </div>

        {/* Bottom Security Band */}
        <div className={`bg-gradient-to-r ${currentTheme.ribbon} py-1.5 px-3 flex items-center justify-between text-white shrink-0`}>
          <div className="flex items-center gap-1 text-[8.5px] font-extrabold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3 text-amber-300" />
            <span>Official Identity</span>
          </div>
          <span className="font-mono text-[8px] font-bold opacity-80">SK-ID-VERIFIED</span>
        </div>
      </div>
    );
  };

  const renderIdCardBack = (emp, isPrint = false) => {
    if (!emp) return null;
    const qrUrl = qrCodeMap[emp.id];
    const contact = emp.id === activeEmployee?.id ? emergencyPhone : (emp.emergencyPhone || emp.phone || '+91 98765 43210');

    return (
      <div 
        className={`w-[245px] h-[360px] rounded-2xl bg-white text-slate-900 shadow-xl overflow-hidden flex flex-col justify-between border border-slate-300 relative select-none ${isPrint ? 'print-card' : ''}`}
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* Top Header */}
        <div className={`${currentTheme.headerBg} text-white px-3.5 pt-3 pb-2 text-center relative shrink-0`}>
          <div className="w-8 h-2.5 rounded-full border border-white/30 mx-auto mb-1.5 opacity-60"></div>
          <h2 className="text-[11px] font-black tracking-wider uppercase leading-tight line-clamp-1">
            Emergency &amp; Verification
          </h2>
        </div>

        {/* Smart QR Code & Emergency Block */}
        <div className="px-3.5 pt-1.5 flex flex-col items-center flex-1 justify-around">
          {/* Dynamic Smart QR Code */}
          <div className="p-1.5 rounded-xl border border-slate-200 bg-white shadow-xs text-center flex flex-col items-center">
            {qrUrl ? (
              <img src={qrUrl} alt="Employee QR Code" className="w-24 h-24" />
            ) : (
              <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-slate-400 text-[10px]">
                Loading QR...
              </div>
            )}
            <span className="text-[8px] font-extrabold uppercase text-slate-500 tracking-wider mt-0.5">
              Scan for Verification
            </span>
          </div>

          {/* Emergency & Address Details */}
          <div className="w-full text-left space-y-1 text-[10px] text-slate-600 pt-1">
            <div className="bg-rose-50 border border-rose-200/80 rounded-lg p-1.5 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-rose-700 flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" /> Emergency:
              </span>
              <span className="font-mono font-bold text-slate-900 text-[10px]">{contact}</span>
            </div>

            <div className="text-[8.5px] leading-tight text-slate-500 pt-0.5">
              <span className="font-bold text-slate-700 block">Registered Office:</span>
              <span className="line-clamp-2">{config.companyAddress || 'Taloja Phase-1, Navi Mumbai - 410208'}</span>
            </div>

            <p className="text-[7.5px] leading-snug text-slate-400 italic pt-0.5">
              * This card is the property of {config.companyName || 'SK ENTERPRISES'}. If found, please return to the registered address above.
            </p>
          </div>

          {/* Authorized Signature Line (Clean for Physical Signing) */}
          <div className="w-full pt-1.5 flex items-end justify-between border-t border-slate-200">
            <div className="text-left">
              <span className="text-[7.5px] text-slate-400 block font-mono">Issued by HR</span>
              <span className="text-[8px] font-black text-slate-700 uppercase">SK ENTERPRISES</span>
            </div>
            <div className="text-right">
              <div className="w-20 border-b border-slate-400 mb-0.5"></div>
              <span className="text-[8px] font-extrabold text-slate-600 block">Authorized Signatory</span>
            </div>
          </div>
        </div>

        {/* Bottom Security Band */}
        <div className="bg-slate-900 py-1 px-3 text-center text-white shrink-0">
          <span className="font-mono text-[8px] font-bold tracking-widest text-slate-300">
            CONFIDENTIAL &amp; NON-TRANSFERABLE
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Print Specific CSS to isolate cards during printing */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 6mm 8mm !important;
          }
          .no-print, nav, aside, header {
            display: none !important;
          }
          .print-card {
            box-shadow: none !important;
            border: 1px solid #94a3b8 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
      
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Contact className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Corporate Employee ID Card Studio
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Lamination Ready • CR80
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              1-Click print &amp; PDF download with dynamic QR codes, blood group, emergency contact, and A4 8-card bulk layout.
            </p>
          </div>
        </div>

        {/* Right Controls: View Mode & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => {
                sounds.playSuccess();
                setViewMode('single');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Single Preview</span>
            </button>
            <button
              onClick={() => {
                sounds.playSuccess();
                setViewMode('a4-sheet');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'a4-sheet'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>A4 Bulk Sheet (8 Cards)</span>
            </button>
          </div>

          {/* Direct Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
            title="Print Cards on Color Printer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Print</span>
          </button>

          {/* Download Image (PNG) Button - Single mode only */}
          {viewMode === 'single' && (
            <button
              onClick={handleDownloadSinglePng}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition cursor-pointer active:scale-95 disabled:opacity-50"
              title="Save ID Card as high-resolution PNG image directly to your phone/PC"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image (PNG)</span>
            </button>
          )}

          {/* Download PDF Button */}
          <button
            onClick={viewMode === 'single' ? handleDownloadSinglePdf : handleDownloadBulkA4Pdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition cursor-pointer active:scale-95 disabled:opacity-50"
            title="Download crisp PDF format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? 'Generating...' : viewMode === 'single' ? 'Download PDF' : 'Download A4 PDF'}</span>
          </button>
        </div>
      </div>

      {/* Clean Offscreen Container for 100% Reliable PDF & PNG Export (Behind page, zero touch interference) */}
      <div 
        style={{ 
          position: 'fixed', 
          left: 0, 
          top: 0, 
          width: '560px', 
          zIndex: -9999,
          pointerEvents: 'none',
          opacity: 0.01,
          overflow: 'hidden'
        }}
        aria-hidden="true"
      >
        <div 
          id="printable-id-card-export"
          style={{ 
            width: '560px', 
            backgroundColor: '#ffffff', 
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          {activeEmployee && (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              {renderIdCardFront(activeEmployee, true)}
              {renderIdCardBack(activeEmployee, true)}
            </div>
          )}
        </div>
      </div>

      {/* Control Ribbon: Employee Selection, Department Filter, and Color Theme */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        
        {/* Left: Search & Filter */}
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee by name, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="p-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>

          {viewMode === 'single' && (
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="p-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold max-w-[220px]"
            >
              {filteredEmployees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
              ))}
            </select>
          )}
        </div>

        {/* Right: Theme Palettes Selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Palette className="w-3.5 h-3.5 text-slate-400 mr-1" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Theme:</span>
          {Object.entries(themes).map(([key, t]) => (
            <button
              key={key}
              onClick={() => {
                sounds.playSuccess();
                setCardTheme(key);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                cardTheme === key
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'single' ? (
        /* ================= SINGLE CARD PREVIEW & METADATA EDITOR ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Card Preview (Front & Back Side-by-Side) */}
          <div className="lg:col-span-8 bg-slate-100/70 dark:bg-slate-950/60 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center justify-center">
            
            <div className="mb-4 text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Direct Lamination Preview • Front &amp; Back
              </span>
            </div>

            {/* Printable Single Container for PDF Export */}
            <div 
              id="printable-single-id-card"
              className="flex flex-wrap items-center justify-center gap-6 p-4 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700"
            >
              {activeEmployee ? (
                <>
                  {/* Front Side */}
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">
                      [ Front Face ]
                    </span>
                    {renderIdCardFront(activeEmployee)}
                  </div>

                  {/* Back Side */}
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">
                      [ Back Face (With Smart QR) ]
                    </span>
                    {renderIdCardBack(activeEmployee)}
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 p-8">No employee selected</p>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-4 text-center max-w-md">
              * Standard CR80 Size (54mm x 85.6mm). Designed to fit inside standard employee badge holders and vertical lanyards.
            </p>
          </div>

          {/* Right Column: Quick Metadata Editor (Blood Group, Emergency Contact, Details) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Card Information Editor
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            {activeEmployee && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Employee Full Name</label>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">{activeEmployee.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Designation</label>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{activeEmployee.role}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Department</label>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{activeEmployee.department || 'Operations'}</p>
                  </div>
                </div>

                {/* Blood Group Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Blood Group</span>
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setBloodGroup(bg)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          bloodGroup === bg 
                            ? 'bg-rose-600 text-white shadow-xs' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emergency Contact Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    <span>Emergency Contact Number</span>
                  </label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Printed on back face of the card for security.</span>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveEmployeeMeta}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/25 transition active:scale-95 cursor-pointer mt-2"
                >
                  Save to Employee Profile
                </button>
              </div>
            )}

            {/* Smart QR Info Box */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-xs space-y-1.5">
              <span className="font-extrabold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <QrCodeIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Instant QR Verification</span>
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                The smart QR code encodes employee credentials. Security guards can scan it with any mobile camera to immediately verify official active duty status.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ================= A4 BULK PRINT SHEET (8 ID CARDS PER SHEET) ================= */
        <div className="bg-slate-100/70 dark:bg-slate-950/60 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center">
          
          {/* Bulk Options Toolbar */}
          <div className="w-full max-w-4xl flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                A4 Color Sheet Layout (8 ID Cards per Page)
              </h3>
              <p className="text-xs text-slate-500">
                Arranged with scissor cut lines (✂) for direct color printing on 250-300 GSM photo paper.
              </p>
            </div>

            {/* Side Filter: Fronts / Backs / Both */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => setSheetSide('front')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  sheetSide === 'front' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Front Faces
              </button>
              <button
                onClick={() => setSheetSide('back')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  sheetSide === 'back' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Back Faces (QR)
              </button>
              <button
                onClick={() => setSheetSide('both')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  sheetSide === 'both' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Front &amp; Back Alternating
              </button>
            </div>
          </div>

          {/* Printable A4 Sheet Container */}
          <div className="overflow-x-auto w-full flex justify-center py-2">
            <div 
              id="printable-a4-sheet"
              className="w-full max-w-[820px] min-w-[620px] sm:min-w-0 bg-white text-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-300 my-2"
            >
            {/* Sheet Header (Excluded from print or subtle) */}
            <div className="text-center pb-4 border-b border-dashed border-slate-200 mb-4">
              <h2 className="text-sm font-black tracking-wider uppercase text-slate-800">
                {config.companyName || 'SK ENTERPRISES'} • OFFICIAL ID CARDS ROSTER
              </h2>
              <p className="text-[10px] text-slate-400">
                Print on A4 Size Heavy Paper / Cardstock (250 GSM) • Cut along dashed guidelines
              </p>
            </div>

            {/* 2-Column Grid for A4 (4 rows x 2 cols = 8 cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 justify-items-center">
              {filteredEmployees.slice(0, sheetSide === 'both' ? 4 : 8).map((emp) => {
                if (sheetSide === 'front') {
                  return (
                    <div key={`front-${emp.id}`} className="relative p-2 border border-dashed border-slate-300 rounded-2xl">
                      <span className="absolute -top-2 left-4 px-1.5 bg-white text-[9px] font-mono font-bold text-slate-400">✂ CUT</span>
                      {renderIdCardFront(emp, true)}
                    </div>
                  );
                } else if (sheetSide === 'back') {
                  return (
                    <div key={`back-${emp.id}`} className="relative p-2 border border-dashed border-slate-300 rounded-2xl">
                      <span className="absolute -top-2 left-4 px-1.5 bg-white text-[9px] font-mono font-bold text-slate-400">✂ CUT</span>
                      {renderIdCardBack(emp, true)}
                    </div>
                  );
                } else {
                  // Both: Front and Back paired together
                  return (
                    <React.Fragment key={`pair-${emp.id}`}>
                      <div className="relative p-2 border border-dashed border-slate-300 rounded-2xl">
                        <span className="absolute -top-2 left-4 px-1.5 bg-white text-[9px] font-mono font-bold text-slate-400">✂ CUT FRONT</span>
                        {renderIdCardFront(emp, true)}
                      </div>
                      <div className="relative p-2 border border-dashed border-slate-300 rounded-2xl">
                        <span className="absolute -top-2 left-4 px-1.5 bg-white text-[9px] font-mono font-bold text-slate-400">✂ CUT BACK</span>
                        {renderIdCardBack(emp, true)}
                      </div>
                    </React.Fragment>
                  );
                }
              })}
            </div>

            {/* Sheet Footer */}
            <div className="text-center pt-6 mt-6 border-t border-dashed border-slate-200 text-[10px] text-slate-400 font-mono">
              SK ENTERPRISES HRMS • ID CARD PRODUCTION SUITE • PAGE 1 OF 1
            </div>
          </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Print A4 Sheet</span>
            </button>
            <button
              onClick={handleDownloadBulkA4Pdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download A4 PDF Sheet'}</span>
            </button>
          </div>

        </div>
      )}

      {/* Mobile Save & Preview Modal (Ensures 100% Download & Long-Press Save on Mobile) */}
      {mobilePreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Contact className="w-4 h-4 text-purple-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  ID Card Generated
                </h3>
              </div>
              <button 
                onClick={() => setMobilePreviewModal(null)} 
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Res Preview Image */}
            <div className="bg-slate-100 dark:bg-slate-950 p-2 rounded-2xl flex justify-center items-center overflow-hidden border border-slate-200 dark:border-slate-800">
              <img 
                src={mobilePreviewModal.url} 
                alt="Generated ID Card" 
                className="max-h-64 object-contain rounded-xl shadow-md select-none"
              />
            </div>

            {/* Mobile Guidance Tip */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              📱 <strong>Mobile Tip:</strong> Tap &amp; hold (long-press) the card image above to save directly to Gallery, or use the buttons below:
            </p>

            {/* Download & Share Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = mobilePreviewModal.url;
                  a.download = mobilePreviewModal.filename;
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => document.body.removeChild(a), 1000);
                  sounds.playSuccess();
                  onSaveToast('Downloading ID Card image...');
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Image</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    if (navigator.share && mobilePreviewModal.blob) {
                      const file = new File([mobilePreviewModal.blob], mobilePreviewModal.filename, { type: 'image/png' });
                      if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                          files: [file],
                          title: `${mobilePreviewModal.employeeName} ID Card`,
                          text: `Official ID Card for ${mobilePreviewModal.employeeName}`
                        });
                        sounds.playSuccess();
                        onSaveToast('ID Card shared successfully!');
                        return;
                      }
                    }
                    // Fallback direct download
                    const a = document.createElement('a');
                    a.href = mobilePreviewModal.url;
                    a.download = mobilePreviewModal.filename;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => document.body.removeChild(a), 1000);
                    onSaveToast('Downloading image...');
                  } catch (err) {
                    if (err.name !== 'AbortError') {
                      console.warn(err);
                    }
                  }
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Share Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
