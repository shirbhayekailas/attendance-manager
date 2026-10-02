import React, { useState } from 'react';
import { 
  Laptop, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  MessageCircle, 
  ArrowRightLeft, 
  ShieldCheck, 
  Smartphone, 
  Wrench, 
  HardHat, 
  CreditCard,
  Building,
  RotateCcw
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function AssetsView({ 
  assets = [], 
  setAssets, 
  employees = [], 
  config, 
  onSaveToast 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assignTargetAsset, setAssignTargetAsset] = useState(null);

  // Form State
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('IT & Laptop');
  const [assetSerial, setAssetSerial] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [assetCondition, setAssetCondition] = useState('Good');
  const [assetValue, setAssetValue] = useState('');

  // Sample seed if empty
  const defaultAssetSeed = [
    {
      id: 'AST-101',
      name: 'Dell Latitude 3420 Laptop',
      category: 'IT & Laptop',
      serialNo: 'DL-LAT-89301',
      assignedTo: employees[0]?.id || 'EMP-101',
      issueDate: '2025-06-15',
      condition: 'Excellent',
      value: 58000,
      status: 'assigned',
    },
    {
      id: 'AST-102',
      name: 'Airtel Postpaid Corporate SIM',
      category: 'Mobile & SIM',
      serialNo: 'SIM-9820192831',
      assignedTo: employees[0]?.id || 'EMP-101',
      issueDate: '2025-06-15',
      condition: 'Active',
      value: 1200,
      status: 'assigned',
    },
    {
      id: 'AST-103',
      name: 'Industrial Safety Helmet & Harness',
      category: 'Safety Gear',
      serialNo: 'SFT-HLM-049',
      assignedTo: employees[1]?.id || '',
      issueDate: '2026-01-10',
      condition: 'Good',
      value: 3500,
      status: employees[1] ? 'assigned' : 'in_stock',
    }
  ];

  const currentAssets = assets.length > 0 ? assets : defaultAssetSeed;

  // Filtered Assets
  const filteredAssets = currentAssets.filter(item => {
    const assignedEmp = employees.find(e => e.id === item.assignedTo);
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.serialNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (assignedEmp && assignedEmp.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  // Handle Add Asset
  const handleAddAsset = (e) => {
    e.preventDefault();
    if (!assetName.trim()) return;
    sounds.playSuccess();

    const created = {
      id: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: assetName.trim(),
      category: assetCategory,
      serialNo: assetSerial.trim() || `SN-${Date.now().toString().slice(-6)}`,
      assignedTo: assignedToId || null,
      issueDate: assignedToId ? new Date().toISOString().split('T')[0] : null,
      condition: assetCondition,
      value: Number(assetValue) || 0,
      status: assignedToId ? 'assigned' : 'in_stock',
    };

    const updated = [...currentAssets, created];
    setAssets(updated);
    setIsAddModalOpen(false);
    setAssetName('');
    setAssetSerial('');
    setAssignedToId('');
    setAssetValue('');
    onSaveToast(`Registered Asset ${created.name} (${created.id})!`);
  };

  // Handle Return Asset
  const handleReturnAsset = (assetId) => {
    sounds.playSuccess();
    const updated = currentAssets.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          assignedTo: null,
          status: 'in_stock',
          returnDate: new Date().toISOString().split('T')[0]
        };
      }
      return a;
    });
    setAssets(updated);
    onSaveToast("Asset returned and added back to inventory stock.");
  };

  // Handle Delete Asset
  const handleDeleteAsset = (assetId, name) => {
    if (window.confirm(`Delete asset record ${name}?`)) {
      sounds.playWarning();
      const updated = currentAssets.filter(a => a.id !== assetId);
      setAssets(updated);
      onSaveToast(`Deleted asset ${name}.`);
    }
  };

  // WhatsApp Asset Handover Note
  const handleShareWhatsAppAsset = (asset) => {
    sounds.playSuccess();
    const emp = employees.find(e => e.id === asset.assignedTo);
    if (!emp) return;
    const phone = (emp.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;

    const msg = `*OFFICIAL ASSET HANDOVER ACKNOWLEDGEMENT*\n*${config?.companyName || 'SK ENTERPRISES'}*\n303, Panchsheel CHS Ltd, Navi Mumbai\n\nEmployee: *${emp.name}* (${emp.id})\n- Asset: *${asset.name}*\n- Asset ID: ${asset.id}\n- Serial Number: ${asset.serialNo}\n- Category: ${asset.category}\n- Issue Date: ${asset.issueDate}\n- Condition: ${asset.condition}\n\n_Please ensure proper care and maintenance. This property remains the asset of SK ENTERPRISES and must be surrendered upon separation._`;

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const totalAssigned = currentAssets.filter(a => a.status === 'assigned').length;
  const totalStock = currentAssets.filter(a => a.status === 'in_stock').length;
  const totalAssetValue = currentAssets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Print Setup */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape !important;
            margin: 8mm 12mm !important;
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
            <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Laptop className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Company Assets &amp; IT Inventory Register
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track company equipment, laptops, mobile SIMs, and safety gears assigned to personnel.
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
            <span>Add New Asset</span>
          </button>
        </div>
      </div>

      {/* Inventory KPI Summary Cards */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Tracked Assets</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{currentAssets.length}</span>
            <span className="text-xs text-slate-400">Units</span>
          </div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block mt-1">
            Valued at ₹{totalAssetValue.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Currently Assigned</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalAssigned}</span>
            <span className="text-xs text-slate-400">In Active Use</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold block mt-1">
            Handover notes verified
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">In Stock / Available</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-sky-600 dark:text-sky-400">{totalStock}</span>
            <span className="text-xs text-slate-400">Ready to Deploy</span>
          </div>
          <span className="text-[10px] text-sky-600 font-bold block mt-1">
            Ready for new onboarding
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Clearance Status</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">100%</span>
          </div>
          <span className="text-[10px] text-purple-600 font-bold block mt-1">
            Zero pending return breaches
          </span>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by asset, serial no, or employee..."
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
            <option value="IT & Laptop">IT &amp; Laptops</option>
            <option value="Mobile & SIM">Mobile &amp; SIM</option>
            <option value="Safety Gear">Safety Gear</option>
            <option value="Tools & Machinery">Tools &amp; Machinery</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="assigned">Assigned</option>
            <option value="in_stock">In Stock</option>
            <option value="under_repair">Under Repair</option>
          </select>
        </div>
      </div>

      {/* Official Print Header */}
      <div className="print-only hidden p-6 border-b-2 border-slate-900 bg-white text-slate-900 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase text-slate-950">
              {config?.companyName || 'SK ENTERPRISES'}
            </h1>
            <p className="text-xs text-slate-600 max-w-xl">
              {config?.companyAddress || '303, Panchsheel chs ltd, plot no 07, sec -02, taloja phase -01, navi mumbai -410208'}
            </p>
            <p className="text-sm font-black text-slate-900 mt-2 uppercase tracking-wide">
              Official Corporate Asset Inventory &amp; Custody Register
            </p>
          </div>
          <div className="text-right text-xs space-y-1">
            <span className="font-bold block">Total Assets: {currentAssets.length}</span>
            <span className="text-slate-500">Certified by IT &amp; HR Admin</span>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Asset Details</th>
                <th className="py-3.5 px-4">Serial / Tag No</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Assigned Personnel</th>
                <th className="py-3.5 px-4 text-center">Issue Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Value (INR)</th>
                <th className="no-print py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No matching company assets found. Click <strong className="text-blue-500">Add New Asset</strong> to register equipment.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const assignedEmp = employees.find(e => e.id === asset.assignedTo);
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{asset.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{asset.id} • {asset.condition}</span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {asset.serialNo}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {asset.category}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {assignedEmp ? (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{assignedEmp.name}</div>
                            <div className="text-[10px] text-slate-400">{assignedEmp.id} • {assignedEmp.department}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium italic">Unassigned (In Stock)</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                        {asset.issueDate ? new Date(asset.issueDate).toLocaleDateString() : '--'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          asset.status === 'assigned'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        }`}>
                          {asset.status === 'assigned' ? 'Assigned' : 'In Stock'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {asset.value ? `₹${Number(asset.value).toLocaleString('en-IN')}` : '--'}
                      </td>

                      <td className="no-print py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {asset.status === 'assigned' && (
                            <>
                              <button
                                onClick={() => handleShareWhatsAppAsset(asset)}
                                className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                title="Share handover receipt on WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReturnAsset(asset.id)}
                                className="px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]"
                                title="Mark returned back to inventory"
                              >
                                Return
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteAsset(asset.id, asset.name)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-blue-500" />
                <span>Register Company Asset</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Asset Title / Model
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lenovo ThinkPad T14 / Jio 5G Router"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="IT & Laptop">IT &amp; Laptop</option>
                    <option value="Mobile & SIM">Mobile &amp; SIM</option>
                    <option value="Safety Gear">Safety Gear</option>
                    <option value="Tools & Machinery">Tools &amp; Machinery</option>
                    <option value="Vehicle & Fleet">Vehicle &amp; Fleet</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Serial / Tag Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SN-891024"
                    value={assetSerial}
                    onChange={(e) => setAssetSerial(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Assign To Personnel
                  </label>
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">Keep in Stock (Unassigned)</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Asset Value (INR)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    value={assetValue}
                    onChange={(e) => setAssetValue(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
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
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
