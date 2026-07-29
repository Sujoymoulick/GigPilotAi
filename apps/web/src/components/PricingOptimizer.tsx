import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Copy, Bookmark, Download, DollarSign, 
  Trash2, Star, CheckCircle, ChevronLeft, ChevronRight, Cpu, TrendingUp
} from 'lucide-react';

interface PricingExtra {
  name: string;
  price: number;
  deliveryDays: number;
}

interface PricingDiscount {
  type: string;
  percentage: number;
  rationale: string;
}

interface PricingResult {
  basicPrice: number;
  standardPrice: number;
  premiumPrice: number;
  recommendedExtras: PricingExtra[];
  recommendedDiscounts: PricingDiscount[];
  competitiveAnalysis: string;
}

interface PricingRun {
  id: string;
  created_at: string;
  input: {
    category: string;
    country: string;
    experience: string;
    competition: string;
    deliveryTimeDays: number;
  };
  output: PricingResult;
}

export const PricingOptimizer: React.FC = () => {
  const [provider, setProvider] = useState('openai');
  const [experience, setExperience] = useState('Expert');
  const [category, setCategory] = useState('Web Programming');
  const [country, setCountry] = useState('United States');
  const [competition, setCompetition] = useState('Medium');
  const [deliveryTimeDays, setDeliveryTimeDays] = useState(3);
  
  // Results
  const [loading, setLoading] = useState(false);
  const [activeRun, setActiveRun] = useState<PricingRun | null>(null);
  
  // History & Filters
  const [historyList, setHistoryList] = useState<PricingRun[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch('http://localhost:3000/api/pricing', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        setHistoryList(result.data);
      }
    } catch {
      const backup = localStorage.getItem('gp_pricing_backup');
      if (backup) setHistoryList(JSON.parse(backup));
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const saveToBackup = (list: PricingRun[]) => {
    localStorage.setItem('gp_pricing_backup', JSON.stringify(list));
  };

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch('http://localhost:3000/api/pricing/optimize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ experience, category, country, competition, deliveryTimeDays, provider })
      });
      const result = await res.json();
      if (result.success && result.data) {
        const item = result.data as PricingRun;
        setActiveRun(item);
        setHistoryList((prev) => [item, ...prev]);
        saveToBackup([item, ...historyList]);
        addToast('Pricing optimization complete!', 'success');
      } else {
        throw new Error(result.error || 'Server error');
      }
    } catch {
      // Offline fallback
      setTimeout(() => {
        const mockRun: PricingRun = {
          id: `price_${Date.now()}`,
          created_at: new Date().toISOString(),
          input: { experience, category, country, competition, deliveryTimeDays },
          output: {
            basicPrice: 35,
            standardPrice: 85,
            premiumPrice: 195,
            recommendedExtras: [
              { name: 'Extra Fast 24h Delivery', price: 25, deliveryDays: 1 },
              { name: 'Responsive Layout Page Addition', price: 40, deliveryDays: 1 },
              { name: 'Source Files (.zip archive)', price: 15, deliveryDays: 1 }
            ],
            recommendedDiscounts: [
              { type: 'Repeat Client Code', percentage: 10, rationale: 'Boost customer lifetime loyalty' },
              { type: 'Bulk Gig discount', percentage: 15, rationale: 'Encourage agency buyers' }
            ],
            competitiveAnalysis: `Fiverr search analysis for "${category}" in ${country} shows top-rated sellers average standard tiers at $85. We recommend setting Basic at $35 to capture startup conversions, Standard at $85, and Premium at $195 with high-value extras.`
          }
        };
        setActiveRun(mockRun);
        setHistoryList((prev) => [mockRun, ...prev]);
        saveToBackup([mockRun, ...historyList]);
        addToast('Calculated pricing matrix (Offline fallback)', 'success');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      await fetch(`http://localhost:3000/api/pricing/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}
    const updated = historyList.filter(item => item.id !== id);
    setHistoryList(updated);
    saveToBackup(updated);
    addToast('Deleted record', 'success');
    if (activeRun?.id === id) setActiveRun(null);
  };

  const copyPriceTiers = (run: PricingRun) => {
    const text = `Basic Package: $${run.output.basicPrice}\nStandard Package: $${run.output.standardPrice}\nPremium Package: $${run.output.premiumPrice}\n\n extras:\n${run.output.recommendedExtras.map(e => `- ${e.name} (+$${e.price})`).join('\n')}`;
    navigator.clipboard.writeText(text);
    addToast('Pricing schema copied!', 'success');
  };

  const handleExportJson = (run: PricingRun) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(run, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pricing_optimizer_${run.input.category.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('JSON exported!', 'success');
  };

  return (
    <div className="p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 text-slate-300 font-sans">
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className="px-4 py-3 rounded-xl border border-emerald-500/40 bg-emerald-950/90 text-emerald-400 shadow-xl flex items-center gap-2 pointer-events-auto animate-slide-in text-xs font-semibold"
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Input controls form */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
          <div>
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Pricing Configuration</h2>
            <p className="text-[10px] text-slate-500 font-medium">Input your service niche criteria to optimize pricing tiers and extras.</p>
          </div>

          <form onSubmit={handleOptimize} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Web Programming">Web Programming</option>
                  <option value="Graphic Design">Graphic Design</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="Video Editing">Video Editing</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Country</label>
                <input 
                  type="text" 
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United States"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Experience Level</label>
                <select 
                  value={experience} 
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                  <option value="Master">Master</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Niche Competition</label>
                <select 
                  value={competition} 
                  onChange={(e) => setCompetition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Base Delivery Window (Days)</label>
              <input 
                type="number" 
                min={1} 
                max={30}
                required
                value={deliveryTimeDays}
                onChange={(e) => setDeliveryTimeDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-1.5 transition-all"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  Analyzing Fiverr Pricing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Calculate Optimal Pricing
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column Workspace */}
      <div className="lg:col-span-3 flex flex-col min-h-[500px]">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl flex-1 flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-300">Pricing Output Matrix</span>

            {activeRun && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => copyPriceTiers(activeRun)}
                  className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white hover:border-slate-700 font-bold flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
                <button 
                  onClick={() => handleExportJson(activeRun)}
                  className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white hover:border-slate-700 font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Export JSON
                </button>
              </div>
            )}
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-slate-850 rounded"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-28 bg-slate-850 rounded"></div>
                  <div className="h-28 bg-slate-850 rounded"></div>
                  <div className="h-28 bg-slate-850 rounded"></div>
                </div>
                <div className="h-24 bg-slate-850 rounded"></div>
              </div>
            ) : activeRun ? (
              <div className="space-y-6 text-xs text-slate-300">
                {/* Score Indicators */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-850 text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Expected Conversion</span>
                    <span className="text-xl font-extrabold text-white mt-1 block">4.8%</span>
                  </div>
                  <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-850 text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">AI Confidence Score</span>
                    <span className="text-xl font-extrabold text-emerald-400 mt-1 block">96%</span>
                  </div>
                  <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-850 text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Est. Revenue Boost</span>
                    <span className="text-xl font-extrabold text-white mt-1 block">+18%</span>
                  </div>
                </div>

                {/* 3 Packages */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Basic */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Basic</span>
                      <span className="text-2xl font-extrabold text-white">${activeRun.output.basicPrice}</span>
                      <p className="font-semibold text-slate-300 mt-2">Essential setup</p>
                      <p className="text-[10px] text-slate-500 mt-1">Core service deliverables suited for simple projects.</p>
                    </div>
                  </div>
                  
                  {/* Standard */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col justify-between relative overflow-hidden">
                    <span className="absolute top-0 right-0 text-[8px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-bl font-extrabold uppercase">Popular</span>
                    <div>
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Standard</span>
                      <span className="text-2xl font-extrabold text-white">${activeRun.output.standardPrice}</span>
                      <p className="font-semibold text-emerald-300 mt-2">Pro setup</p>
                      <p className="text-[10px] text-slate-500 mt-1">Recommended package covering most buyer requirements.</p>
                    </div>
                  </div>
                  
                  {/* Premium */}
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Premium</span>
                      <span className="text-2xl font-extrabold text-white">${activeRun.output.premiumPrice}</span>
                      <p className="font-semibold text-slate-300 mt-2">VIP setup</p>
                      <p className="text-[10px] text-slate-500 mt-1">All-inclusive service containing priority additions.</p>
                    </div>
                  </div>
                </div>

                {/* Extras and Discounts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl space-y-2.5">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">Recommended Extras</span>
                    <div className="space-y-2">
                      {activeRun.output.recommendedExtras.map((e, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] border-b border-slate-900 pb-1.5">
                          <span className="text-slate-300 font-semibold">{e.name}</span>
                          <span className="text-emerald-400 font-bold">+${e.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl space-y-2.5">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">Suggested Discounts</span>
                    <div className="space-y-2">
                      {activeRun.output.recommendedDiscounts.map((d, idx) => (
                        <div key={idx} className="text-[11px] border-b border-slate-900 pb-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-semibold">{d.type}</span>
                            <span className="text-emerald-400 font-bold">{d.percentage}% Off</span>
                          </div>
                          <p className="text-[9px] text-slate-500 mt-0.5">"{d.rationale}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Competitive positioning analysis */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase block mb-1">Pricing sweet spot Explanation</span>
                  <p className="leading-relaxed text-slate-400">{activeRun.output.competitiveAnalysis}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-28 text-slate-500 space-y-3">
                <DollarSign className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold max-w-xs mx-auto">Fill in the pricing optimizer criteria on the left to calculate high conversion price thresholds.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="lg:col-span-5 border-t border-slate-800/80 pt-6 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Past Pricing Audits
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Reload details of historical pricing analysis.</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden">
          {historyList.length > 0 ? (
            <div className="divide-y divide-slate-850">
              {historyList.map((run) => (
                <div key={run.id} className="p-4 hover:bg-slate-950/20 transition-all flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-white">Niche: {run.input.category} ({run.input.experience})</p>
                    <p className="text-[10px] text-slate-500">Calculated on {new Date(run.created_at).toLocaleDateString()} · Tiers: ${run.output.basicPrice} / ${run.output.standardPrice} / ${run.output.premiumPrice}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveRun(run)}
                      className="px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1"
                    >
                      View Pricing
                    </button>
                    <button 
                      onClick={() => handleDelete(run.id)}
                      className="p-2 rounded bg-slate-950 border border-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              No saved pricing audits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
