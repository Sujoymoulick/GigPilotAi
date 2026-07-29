import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, Search, Trash2, Download, Copy, 
  CheckCircle, Star, Edit3, X, Calendar, Filter, Eye
} from 'lucide-react';

interface GenerationRecord {
  id: string;
  module: string;
  input: Record<string, any>;
  output: Record<string, any>;
  tokens_used?: number;
  tokensUsed?: number;
  provider: string;
  is_favorite: boolean;
  isFavorite: boolean;
  created_at: string;
}

export const HistoryManager: React.FC = () => {
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toolFilter, setToolFilter] = useState('all');
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  
  // Inspector Modal
  const [activeItem, setActiveItem] = useState<GenerationRecord | null>(null);

  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  const addToast = (message: string) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch('http://localhost:3000/api/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        setHistory(result.data);
      }
    } catch {
      // Offline backup load
      const proposalsBackup = localStorage.getItem('gp_proposals_backup') || '[]';
      const keywordsBackup = localStorage.getItem('gp_keywords_backup') || '[]';
      const pricingBackup = localStorage.getItem('gp_pricing_backup') || '[]';
      const healthBackup = localStorage.getItem('gp_health_backup') || '[]';
      const portfolioBackup = localStorage.getItem('gp_portfolio_backup') || '[]';
      const messagesBackup = localStorage.getItem('gp_messages_backup') || '[]';
      const reviewsBackup = localStorage.getItem('gp_reviews_backup') || '[]';
      const seoBackup = localStorage.getItem('gp_seo_backup') || '[]';

      const combined = [
        ...JSON.parse(proposalsBackup),
        ...JSON.parse(keywordsBackup),
        ...JSON.parse(pricingBackup),
        ...JSON.parse(healthBackup),
        ...JSON.parse(portfolioBackup),
        ...JSON.parse(messagesBackup),
        ...JSON.parse(reviewsBackup),
        ...JSON.parse(seoBackup)
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setHistory(combined);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFavorite = async (item: GenerationRecord) => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch('http://localhost:3000/api/favorites/toggle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'generation', id: item.id })
      });
      const result = await res.json();
      if (result.success) {
        const isFav = result.isFavorite;
        const updated = history.map(h => h.id === item.id ? { ...h, is_favorite: isFav, isFavorite: isFav } : h);
        setHistory(updated);
        addToast(isFav ? 'Added to favorites!' : 'Removed from favorites');
      }
    } catch {
      const updated = history.map(h => h.id === item.id ? { ...h, isFavorite: !h.isFavorite, is_favorite: !h.is_favorite } : h);
      setHistory(updated);
      addToast('Toggled favorite locally');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      await fetch(`http://localhost:3000/api/history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    addToast('Deleted generation log!');
    if (activeItem?.id === id) setActiveItem(null);
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all history? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      await fetch('http://localhost:3000/api/history', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}
    setHistory([]);
    addToast('All workspace history cleared!');
  };

  const copyPayload = (item: GenerationRecord) => {
    const text = typeof item.output === 'object' 
      ? JSON.stringify(item.output, null, 2)
      : String(item.output);
    navigator.clipboard.writeText(text);
    addToast('Copied payload contents!');
  };

  const downloadJson = (item: GenerationRecord) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `generation_${item.module.toLowerCase().replace(/\s+/g, '_')}_${item.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('JSON log downloaded!');
  };

  const filteredHistory = history.filter((item) => {
    const term = searchQuery.toLowerCase();
    const searchString = `${item.module} ${JSON.stringify(item.input)} ${JSON.stringify(item.output)}`.toLowerCase();
    const matchesSearch = searchString.includes(term);
    
    // Module checks
    const matchesTool = toolFilter === 'all' || item.module.toLowerCase().replace(/\s+/g, '-') === toolFilter;
    const matchesFav = !favoriteFilter || item.is_favorite || item.isFavorite;

    return matchesSearch && matchesTool && matchesFav;
  });

  return (
    <div className="p-6 max-w-7xl w-full mx-auto space-y-6 text-slate-300 font-sans">
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

      {/* Toolbar Filter block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-slate-500" />
            </span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history content..." 
              className="bg-slate-950 border border-slate-850 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-white focus:outline-none"
            />
          </div>

          <select 
            value={toolFilter} 
            onChange={(e) => setToolFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-400 focus:outline-none"
          >
            <option value="all">All Modules</option>
            <option value="proposal-generator">Proposal Generator</option>
            <option value="keyword-finder">Keyword Finder</option>
            <option value="pricing-optimizer">Pricing Optimizer</option>
            <option value="gig-health-checker">Gig Health Checker</option>
            <option value="portfolio-builder">Portfolio Builder</option>
            <option value="client-messages">Client Messages</option>
            <option value="review-analyzer">Review Analyzer</option>
            <option value="seo-audit">SEO Audit</option>
          </select>

          <button 
            onClick={() => setFavoriteFilter(!favoriteFilter)}
            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
              favoriteFilter 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-3 h-3 fill-current" /> Favorites
          </button>
        </div>

        {history.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="px-3.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/20 text-rose-400 text-[10px] font-bold flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All History
          </button>
        )}
      </div>

      {/* History table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-500 font-bold bg-slate-950/40">
                <th className="p-4">Module Tool</th>
                <th className="p-4">Inputs Summary</th>
                <th className="p-4">Date Run</th>
                <th className="p-4">Provider</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-950/20 text-slate-350 transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white">{item.module}</span>
                        {(item.is_favorite || item.isFavorite) && <Star className="w-3 h-3 text-amber-400 fill-current" />}
                      </div>
                    </td>
                    <td className="p-4 max-w-xs truncate">
                      <span className="text-[10px] text-slate-400 font-mono truncate block">
                        {JSON.stringify(item.input)}
                      </span>
                    </td>
                    <td className="p-4 flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-[10px] text-teal-400">
                      {item.provider || 'AI engine'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button 
                          onClick={() => setActiveItem(item)}
                          className="px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                        <button 
                          onClick={() => handleFavorite(item)}
                          className="p-1.5 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded bg-slate-950 border border-slate-850 hover:bg-rose-950 hover:text-rose-400 text-slate-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-20 text-slate-500 text-xs">
                    No historical logs found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Details Drawer Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-850 flex justify-between items-center flex-shrink-0">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Inspect generation Log ({activeItem.module})
              </span>
              <button onClick={() => setActiveItem(null)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Info row */}
              <div className="grid grid-cols-2 gap-3 text-[10px] bg-slate-950 p-3 rounded-xl border border-slate-850">
                <div>Date: <strong>{new Date(activeItem.created_at).toLocaleString()}</strong></div>
                <div>Model Provider: <strong>{activeItem.provider}</strong></div>
              </div>

              {/* Input details */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Input configuration</span>
                <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 overflow-x-auto text-[10px] font-mono text-slate-300">
                  {JSON.stringify(activeItem.input, null, 2)}
                </pre>
              </div>

              {/* Output Details */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Output payload results</span>
                <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 overflow-x-auto text-[10px] font-mono text-slate-350">
                  {JSON.stringify(activeItem.output, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-950/60 border-t border-slate-850 flex justify-end gap-2 flex-shrink-0">
              <button 
                onClick={() => copyPayload(activeItem)}
                className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white font-bold flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Output
              </button>
              <button 
                onClick={() => downloadJson(activeItem)}
                className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white font-bold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
