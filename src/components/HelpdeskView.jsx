import React, { useState } from 'react';
import { 
  HelpCircle, 
  Plus, 
  Search, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MessageCircle, 
  Tag, 
  User, 
  Building,
  CheckSquare2,
  Trash2
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function HelpdeskView({ 
  helpdesk = [], 
  setHelpdesk, 
  employees = [], 
  config, 
  onSaveToast, 
  role = 'admin' 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeResolveModal, setActiveResolveModal] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Form State
  const [targetEmpId, setTargetEmpId] = useState(() => employees[0]?.id || '');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Payroll & Salary');
  const [ticketPriority, setTicketPriority] = useState('High');
  const [ticketDescription, setTicketDescription] = useState('');

  // Default seed if empty
  const defaultTicketsSeed = [
    {
      id: 'TCK-201',
      empId: employees[0]?.id || 'EMP-101',
      subject: 'Clarification regarding Overtime Calculation in Payslip',
      category: 'Payroll & Salary',
      priority: 'High',
      description: 'Logged 4 hours OT during Sunday site setup. Please confirm if it reflects in gross earnings.',
      status: 'resolved',
      createdAt: '2026-09-28',
      resolvedAt: '2026-09-29',
      resolution: 'Verified. Overtime + Week Off Duty pay added to September payroll run.',
      resolvedBy: 'HR Payroll Admin'
    },
    {
      id: 'TCK-202',
      empId: employees[1]?.id || 'EMP-102',
      subject: 'UAN / PF Portal KYC Linking Update',
      category: 'PF & Statutory',
      priority: 'Medium',
      description: 'Need assistance linking Aadhaar with EPFO portal for PF passbook download.',
      status: 'open',
      createdAt: '2026-10-01',
      resolvedAt: null,
      resolution: null,
      resolvedBy: null
    }
  ];

  const tickets = helpdesk.length > 0 ? helpdesk : defaultTicketsSeed;

  const filteredTickets = tickets.filter(t => {
    const emp = employees.find(e => e.id === t.empId);
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (emp && emp.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = filterCategory === 'all' || t.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!ticketSubject.trim()) return;
    sounds.playSuccess();

    const created = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      empId: targetEmpId,
      subject: ticketSubject.trim(),
      category: ticketCategory,
      priority: ticketPriority,
      description: ticketDescription.trim() || 'No additional details provided.',
      status: 'open',
      createdAt: new Date().toISOString().split('T')[0],
      resolvedAt: null,
      resolution: null,
      resolvedBy: null
    };

    const updated = [created, ...tickets];
    setHelpdesk(updated);
    setIsAddModalOpen(false);
    setTicketSubject('');
    setTicketDescription('');
    onSaveToast(`Ticket ${created.id} logged successfully!`);
  };

  const handleResolveTicket = (e) => {
    e?.preventDefault();
    if (!activeResolveModal) return;
    sounds.playSuccess();

    const updated = tickets.map(t => {
      if (t.id === activeResolveModal.id) {
        return {
          ...t,
          status: 'resolved',
          resolvedAt: new Date().toISOString().split('T')[0],
          resolution: resolutionNote || 'Resolved by HR Administration.',
          resolvedBy: 'HR Administration'
        };
      }
      return t;
    });

    setHelpdesk(updated);
    setActiveResolveModal(null);
    setResolutionNote('');
    onSaveToast(`Ticket ${activeResolveModal.id} marked as RESOLVED!`);
  };

  const handleShareWhatsAppTicket = (ticket) => {
    sounds.playSuccess();
    const emp = employees.find(e => e.id === ticket.empId);
    if (!emp) return;
    const phone = (emp.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;

    const msg = `*HR HELPDESK TICKET UPDATE - ${ticket.id}*\n*${config?.companyName || 'SK ENTERPRISES'}*\n\nDear *${emp.name}*,\nYour ticket *"${ticket.subject}"* has been marked as *${ticket.status.toUpperCase()}*.\n\n*Resolution Remarks:*\n"${ticket.resolution || 'Your query is being processed.'}"\n\n_Thank you for contacting SK ENTERPRISES HR Helpdesk._`;

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const openCount = tickets.filter(t => t.status === 'open').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Company HR Helpdesk &amp; Grievance Redressal
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Resolve employee payroll inquiries, PF/ESIC updates, leave corrections, and site requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Raise HR Ticket</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Open Tickets</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{openCount}</span>
            <span className="text-xs text-slate-400">Pending Action</span>
          </div>
          <span className="text-[10px] text-amber-600 font-bold block mt-1">
            24h Corporate SLA Standard
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Resolved Queries</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{resolvedCount}</span>
            <span className="text-xs text-slate-400">Closed</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold block mt-1">
            100% Employee Satisfaction
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Lifecycle Tickets</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{tickets.length}</span>
          </div>
          <span className="text-[10px] text-blue-600 font-bold block mt-1">
            Logged across all departments
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by subject, ID, or employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Payroll & Salary">Payroll &amp; Salary</option>
            <option value="PF & Statutory">PF &amp; Statutory</option>
            <option value="Leave & Attendance">Leave &amp; Attendance</option>
            <option value="Site Allowance">Site Allowance</option>
            <option value="General HR">General HR</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open (Action Needed)</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            No matching helpdesk tickets found. Click <strong className="text-blue-500">Raise HR Ticket</strong> to submit a query.
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const emp = employees.find(e => e.id === ticket.empId);
            return (
              <div
                key={ticket.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-2xl shrink-0 ${
                      ticket.status === 'resolved' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600' 
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                    }`}>
                      {ticket.status === 'resolved' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-400">{ticket.id}</span>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                          ticket.priority === 'High' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                          ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {ticket.priority} Priority
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {ticket.category}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                        {ticket.subject}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {ticket.description}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                        <span>Submitted by: <strong className="text-slate-700 dark:text-slate-300">{emp?.name || ticket.empId}</strong> ({ticket.empId})</span>
                        <span>•</span>
                        <span>Date: {ticket.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      ticket.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {ticket.status === 'resolved' ? 'Resolved' : 'Action Pending'}
                    </span>

                    <div className="flex items-center gap-1.5 mt-1">
                      {ticket.status !== 'resolved' && (
                        <button
                          onClick={() => {
                            setActiveResolveModal(ticket);
                            setResolutionNote('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                        >
                          Resolve Ticket
                        </button>
                      )}

                      <button
                        onClick={() => handleShareWhatsAppTicket(ticket)}
                        className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        title="Send update to employee via WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Resolution Remarks Box if Resolved */}
                {ticket.status === 'resolved' && ticket.resolution && (
                  <div className="mt-2 p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 text-xs">
                    <span className="font-black text-emerald-800 dark:text-emerald-300 uppercase text-[9px] block">
                      Resolution Remarks (By {ticket.resolvedBy || 'HR Admin'} on {ticket.resolvedAt || ticket.createdAt}):
                    </span>
                    <p className="text-emerald-950 dark:text-emerald-200 mt-0.5 font-medium">
                      "{ticket.resolution}"
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Raise Ticket Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-500" />
                <span>Submit HR Helpdesk Ticket</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Employee
                </label>
                <select
                  value={targetEmpId}
                  onChange={(e) => setTargetEmpId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Query Subject / Topic
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Overtime adjustment for Sunday shift..."
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Payroll & Salary">Payroll &amp; Salary</option>
                    <option value="PF & Statutory">PF &amp; Statutory</option>
                    <option value="Leave & Attendance">Leave &amp; Attendance</option>
                    <option value="Site Allowance">Site Allowance</option>
                    <option value="General HR">General HR</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Priority
                  </label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="High">High (Urgent 24h)</option>
                    <option value="Medium">Medium (48h)</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Detailed Explanation
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide date, specific details, or reason for request..."
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
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
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {activeResolveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Resolve Ticket {activeResolveModal.id}</span>
            </h3>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">{activeResolveModal.subject}</p>
              <p className="text-slate-500">{activeResolveModal.description}</p>
            </div>

            <form onSubmit={handleResolveTicket} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Resolution Action / Note
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the resolution taken, correction made in payroll, or explanation provided..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full p-3 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveResolveModal(null)}
                  className="w-1/2 py-2.5 text-xs font-bold rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30"
                >
                  Confirm Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
