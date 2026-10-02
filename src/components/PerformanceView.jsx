import React, { useState } from 'react';
import { 
  Award, 
  Star, 
  TrendingUp, 
  Search, 
  Plus, 
  Printer, 
  MessageCircle, 
  CheckCircle2, 
  Briefcase, 
  Calendar,
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function PerformanceView({ 
  performance = [], 
  setPerformance, 
  employees = [], 
  config, 
  onSaveToast 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('Fiscal 2026-27');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Review Form State
  const [targetEmpId, setTargetEmpId] = useState(() => employees[0]?.id || '');
  const [techRating, setTechRating] = useState(4);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [teamworkRating, setTeamworkRating] = useState(4);
  const [ownershipRating, setOwnershipRating] = useState(5);
  const [managerFeedback, setManagerFeedback] = useState('Demonstrates exceptional diligence, reliability on site, and exemplary attendance records.');
  const [recommendedIncrement, setRecommendedIncrement] = useState('15');

  // Default seed if empty
  const defaultPerformanceSeed = employees.slice(0, 5).map((emp, idx) => ({
    id: `PRF-${emp.id}-${idx}`,
    empId: emp.id,
    cycle: 'Fiscal 2026-27',
    date: '2026-09-30',
    techScore: 4.5,
    punctualityScore: 5.0,
    teamworkScore: 4.5,
    ownershipScore: 4.8,
    overallRating: 4.7,
    feedback: 'High performer with zero unauthorized absences. Consistently delivers site operations smoothly.',
    incrementRecommendation: 15,
    reviewedBy: 'Managing Director / HR Head',
  }));

  const reviews = performance.length > 0 ? performance : defaultPerformanceSeed;

  const filteredReviews = reviews.filter(rev => {
    const emp = employees.find(e => e.id === rev.empId);
    const matchesSearch = (emp && emp.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          rev.empId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCycle = selectedCycle === 'all' || rev.cycle === selectedCycle;
    return matchesSearch && matchesCycle;
  });

  const handleSaveReview = (e) => {
    e.preventDefault();
    if (!targetEmpId) return;
    sounds.playSuccess();

    const avg = Number(((techRating + punctualityRating + teamworkRating + ownershipRating) / 4).toFixed(1));
    const created = {
      id: `PRF-${Date.now()}`,
      empId: targetEmpId,
      cycle: selectedCycle === 'all' ? 'Fiscal 2026-27' : selectedCycle,
      date: new Date().toISOString().split('T')[0],
      techScore: techRating,
      punctualityScore: punctualityRating,
      teamworkScore: teamworkRating,
      ownershipScore: ownershipRating,
      overallRating: avg,
      feedback: managerFeedback,
      incrementRecommendation: Number(recommendedIncrement) || 10,
      reviewedBy: 'HR Management',
    };

    const updated = [created, ...reviews.filter(r => r.empId !== targetEmpId || r.cycle !== created.cycle)];
    setPerformance(updated);
    setIsAddModalOpen(false);
    const empName = employees.find(e => e.id === targetEmpId)?.name || targetEmpId;
    onSaveToast(`Appraisal review submitted for ${empName} (${avg} ★)!`);
  };

  const handleShareWhatsAppReview = (rev) => {
    sounds.playSuccess();
    const emp = employees.find(e => e.id === rev.empId);
    if (!emp) return;
    const phone = (emp.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;

    const msg = `*ANNUAL PERFORMANCE APPRAISAL RESULT*\n*${config?.companyName || 'SK ENTERPRISES'}*\nCycle: ${rev.cycle}\n\nEmployee: *${emp.name}* (${emp.id})\n- Overall Performance Score: *${rev.overallRating} / 5.0 ★*\n- Shift & Punctuality Rating: ${rev.punctualityScore} / 5.0\n- Technical Quality: ${rev.techScore} / 5.0\n- Recommended Increment: *+${rev.incrementRecommendation}%*\n\n*Manager Feedback:*\n"${rev.feedback}"\n\n_Congratulations on your commendable achievements and dedication towards company growth!_`;

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const renderStars = (score) => {
    const rounded = Math.round(score);
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            className={`w-3.5 h-3.5 ${s <= rounded ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Print Styling */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 10mm 15mm !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header */}
      <div className="no-print bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Employee Performance, KRA &amp; Appraisal Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Conduct 360° reviews, score punctuality and technical deliverables, and recommend salary increments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playSuccess();
              window.print();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Register</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Conduct Review</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee review..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Appraisal Cycle:</span>
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="Fiscal 2026-27">Fiscal 2026-27</option>
            <option value="Fiscal 2025-26">Fiscal 2025-26</option>
            <option value="all">All Historical Cycles</option>
          </select>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReviews.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            No appraisal records found. Click <strong className="text-blue-500">Conduct Review</strong> to evaluate staff.
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const emp = employees.find(e => e.id === rev.empId);
            if (!emp) return null;

            return (
              <div
                key={rev.id}
                className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all"
              >
                {/* Employee Header & Rating Score */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {emp.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {emp.id} • {emp.role} • {emp.department}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end font-black text-lg text-amber-500">
                      <span>{rev.overallRating}</span>
                      <Star className="w-4 h-4 fill-amber-400" />
                    </div>
                    {renderStars(rev.overallRating)}
                  </div>
                </div>

                {/* Competency 4-Grid Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Technical Skills</span>
                    <span className="font-bold text-slate-900 dark:text-white">{rev.techScore} / 5.0</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Punctuality</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{rev.punctualityScore} / 5.0</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Teamwork</span>
                    <span className="font-bold text-slate-900 dark:text-white">{rev.teamworkScore} / 5.0</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Ownership</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{rev.ownershipScore} / 5.0</span>
                  </div>
                </div>

                {/* Manager Feedback Quote */}
                <div className="text-xs text-slate-600 dark:text-slate-300 italic bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-200/50 dark:border-amber-900/30">
                  "{rev.feedback}"
                </div>

                {/* Increment & Actions Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>Recommended CTC Increment: +{rev.incrementRecommendation}%</span>
                  </div>

                  <div className="no-print flex items-center gap-2">
                    <button
                      onClick={() => handleShareWhatsAppReview(rev)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold transition-colors"
                      title="Send Appraisal to Employee on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Conduct Review Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Conduct Annual Performance Appraisal</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Staff Member
                </label>
                <select
                  value={targetEmpId}
                  onChange={(e) => setTargetEmpId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id}) • {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4 Ratings Sliders */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <div className="flex justify-between font-bold mb-1">
                    <span>Technical Competence</span>
                    <span className="text-amber-500">{techRating} ★</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={techRating}
                    onChange={(e) => setTechRating(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <div className="flex justify-between font-bold mb-1">
                    <span>Shift &amp; Punctuality</span>
                    <span className="text-emerald-500">{punctualityRating} ★</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={punctualityRating}
                    onChange={(e) => setPunctualityRating(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <div className="flex justify-between font-bold mb-1">
                    <span>Teamwork &amp; Collab</span>
                    <span className="text-blue-500">{teamworkRating} ★</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={teamworkRating}
                    onChange={(e) => setTeamworkRating(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <div className="flex justify-between font-bold mb-1">
                    <span>Delivery Ownership</span>
                    <span className="text-purple-500">{ownershipRating} ★</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={ownershipRating}
                    onChange={(e) => setOwnershipRating(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>

              {/* Recommended Increment */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Recommended Salary Increment (%)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+</span>
                  <input
                    type="number"
                    value={recommendedIncrement}
                    onChange={(e) => setRecommendedIncrement(e.target.value)}
                    placeholder="15"
                    className="w-full pl-8 pr-8 py-2 text-xs font-mono font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              {/* Manager Feedback */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Appraisal Notes &amp; Strengths
                </label>
                <textarea
                  rows={3}
                  value={managerFeedback}
                  onChange={(e) => setManagerFeedback(e.target.value)}
                  className="w-full p-3 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-black rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30"
                >
                  Confirm Appraisal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
