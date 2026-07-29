import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Trash2, Edit2, Calendar, Target, 
  DollarSign, CheckCircle2, AlertCircle, RefreshCw, FolderClosed
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  color: string;
  start_date: string;
  end_date: string;
  budget: number;
  goal: string;
  status: string;
}

export const CampaignsManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState(0);
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState('Active');

  const [toasts, setToasts] = useState<{ id: string; message: string; type?: 'success' | 'error' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const gpToken = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/campaigns', {
        headers: { 'Authorization': `Bearer ${gpToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data || []);
      }
    } catch {
      showToast('Failed to load campaigns list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    // default end date 30 days later
    const end = new Date();
    end.setDate(end.getDate() + 30);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  const handleCreateOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const gpToken = localStorage.getItem('gp_token') || 'mock-session-token';
      const payload: any = {
        name,
        description,
        color,
        start_date: startDate,
        end_date: endDate,
        budget: Number(budget),
        goal,
        status
      };

      if (editingCampaign) {
        payload.id = editingCampaign.id;
      }

      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gpToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingCampaign ? 'Campaign updated successfully!' : 'Campaign created successfully!');
        setShowModal(false);
        resetForm();
        loadCampaigns();
      }
    } catch {
      showToast('Action failed. Try again.', 'error');
    }
  };

  const handleDelete = async (id: string, campName: string) => {
    if (!confirm(`Are you sure you want to delete campaign "${campName}"?`)) return;
    try {
      const gpToken = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_URL || 'http://localhost:3000'}/api/social/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${gpToken}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Campaign deleted.');
        loadCampaigns();
      }
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const openEdit = (camp: Campaign) => {
    setEditingCampaign(camp);
    setName(camp.name);
    setDescription(camp.description);
    setColor(camp.color);
    setStartDate(camp.start_date);
    setEndDate(camp.end_date);
    setBudget(camp.budget);
    setGoal(camp.goal);
    setStatus(camp.status);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCampaign(null);
    setName('');
    setDescription('');
    setColor('#3B82F6');
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    const end = new Date();
    end.setDate(end.getDate() + 30);
    setEndDate(end.toISOString().split('T')[0]);
    setBudget(0);
    setGoal('');
    setStatus('Active');
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <div className="fixed top-5 right-5 z-50 space-y-2">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`p-4 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold backdrop-blur-md border ${
              t.type === 'error' 
                ? 'bg-rose-950/80 border-rose-500/30 text-rose-300' 
                : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {t.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-400" />
            Marketing Campaigns
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Group your social schedule under campaigns to align goals, budgets, and track outcomes.
          </p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-500 rounded-xl border border-emerald-500/20 shadow-md shadow-emerald-500/10 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="text-center py-20 text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600" />
          Loading marketing campaigns...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-slate-950/20 border border-dashed border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <Megaphone className="w-12 h-12 text-slate-700 mx-auto mb-3 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-slate-350">No Campaigns Active</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto">
            Organize your upcoming social promotions by creating your first campaign now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((camp) => (
            <div 
              key={camp.id} 
              className="bg-slate-950/40 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-750 transition-all backdrop-blur-xl flex flex-col justify-between"
            >
              {/* Header card border */}
              <div className="p-5 border-b border-slate-850/60 relative">
                <span className="absolute top-5 right-5 text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  {camp.status}
                </span>
                
                <div className="flex items-center gap-3">
                  <div className="w-4.5 h-4.5 rounded-full" style={{ backgroundColor: camp.color }} />
                  <h3 className="text-sm font-bold text-white leading-none">{camp.name}</h3>
                </div>
                
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">{camp.description || 'No description provided.'}</p>
              </div>

              {/* Metrics */}
              <div className="p-5 bg-slate-900/10 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Timeline
                    </span>
                    <span className="text-slate-300 font-medium">
                      {new Date(camp.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(camp.end_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" /> Campaign Goal
                    </span>
                    <span className="text-slate-300 font-medium truncate block">{camp.goal || 'General Engagement'}</span>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> Budget Allocated
                    </span>
                    <span className="text-slate-300 font-bold font-mono">
                      {camp.budget ? `$${camp.budget.toLocaleString()}` : 'No Budget Set'}
                    </span>
                  </div>
                </div>

                {/* Edit & delete buttons */}
                <div className="flex gap-2 border-t border-slate-900/60 pt-4">
                  <button 
                    onClick={() => openEdit(camp)}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-xl border border-slate-850 hover:border-slate-750 transition-all flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Modify Details
                  </button>
                  <button 
                    onClick={() => handleDelete(camp.id, camp.name)}
                    className="p-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-450 hover:text-rose-300 border border-rose-900/20 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D121F] border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-850">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white capitalize">
                  {editingCampaign ? 'Modify Campaign Details' : 'Create New Campaign'}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-xs text-slate-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateOrEdit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Launch Blitz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Description</label>
                <textarea
                  placeholder="Campaign marketing descriptions, target audience..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Budget (USD)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Campaign Goal</label>
                  <input
                    type="text"
                    placeholder="e.g. 1000 clicks"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Color Tag</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl h-10 p-1 text-xs text-white focus:outline-none cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-850 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-350 hover:text-white rounded-xl border border-slate-850 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg border border-emerald-500/20 transition-all"
                >
                  Confirm Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
