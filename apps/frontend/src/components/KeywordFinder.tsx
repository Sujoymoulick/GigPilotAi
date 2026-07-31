import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Copy, Bookmark, Download, Search, Filter, 
  Trash2, Star, CheckCircle, ChevronLeft, ChevronRight, BarChart3, TrendingUp
} from 'lucide-react';

interface KeywordMetric {
  keyword: string;
  type: 'primary' | 'long-tail' | 'related' | 'competitor';
  estimatedSearchVolume: number;
  competitionLevel: 'Low' | 'Medium' | 'High';
  difficultyScore: number;
  opportunityScore: number;
  trend: 'Rising' | 'Stable' | 'Declining';
  intent: 'Informational' | 'Transactional' | 'Commercial';
}

interface KeywordRun {
  id: string;
  created_at: string;
  service: string;
  keyword_data: {
    primaryKeywords: KeywordMetric[];
    longTailKeywords: KeywordMetric[];
    relatedSearches: KeywordMetric[];
    competitorKeywords: KeywordMetric[];
    summary: {
      avgDifficulty: number;
      avgOpportunity: number;
      recommendedFocus: string[];
    };
  };
  isFavorite?: boolean;
}

export const KeywordFinder: React.FC = () => {
  const [provider, setProvider] = useState('openai');
  const [service, setService] = useState('');
  const [category, setCategory] = useState('Programming & Tech');
  
  // Results
  const [loading, setLoading] = useState(false);
  const [activeRun, setActiveRun] = useState<KeywordRun | null>(null);
  
  // History & Filters
  const [historyList, setHistoryList] = useState<KeywordRun[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/keywords', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        setHistoryList(result.data);
      }
    } catch {
      const backup = localStorage.getItem('gp_keywords_backup');
      if (backup) setHistoryList(JSON.parse(backup));
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const saveToBackup = (list: KeywordRun[]) => {
    localStorage.setItem('gp_keywords_backup', JSON.stringify(list));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/keywords/find', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ service, category, provider })
      });
      const result = await res.json();
      if (result.success && result.data) {
        const item = result.data as KeywordRun;
        setActiveRun(item);
        setHistoryList((prev) => [item, ...prev]);
        saveToBackup([item, ...historyList]);
        addToast('Keywords research complete!', 'success');
      } else {
        throw new Error(result.error || 'Server error');
      }
    } catch {
      // Fallback
      setTimeout(() => {
        const mockRun: KeywordRun = {
          id: `key_${Date.now()}`,
          created_at: new Date().toISOString(),
          service,
          keyword_data: {
            primaryKeywords: [
              { keyword: `${service.toLowerCase()}`, type: 'primary', estimatedSearchVolume: 14200, competitionLevel: 'High', difficultyScore: 78, opportunityScore: 45, trend: 'Stable', intent: 'Transactional' },
              { keyword: `professional ${service.toLowerCase()}`, type: 'primary', estimatedSearchVolume: 9800, competitionLevel: 'Medium', difficultyScore: 54, opportunityScore: 80, trend: 'Rising', intent: 'Transactional' },
            ],
            longTailKeywords: [
              { keyword: `custom minimalist ${service.toLowerCase()} agency`, type: 'long-tail', estimatedSearchVolume: 3200, competitionLevel: 'Low', difficultyScore: 22, opportunityScore: 94, trend: 'Rising', intent: 'Transactional' },
              { keyword: `urgent responsive ${service.toLowerCase()}`, type: 'long-tail', estimatedSearchVolume: 1800, competitionLevel: 'Low', difficultyScore: 28, opportunityScore: 90, trend: 'Rising', intent: 'Commercial' },
            ],
            relatedSearches: [
              { keyword: `design visual identity`, type: 'related', estimatedSearchVolume: 6700, competitionLevel: 'Medium', difficultyScore: 40, opportunityScore: 78, trend: 'Stable', intent: 'Informational' }
            ],
            competitorKeywords: [
              { keyword: `top rated ${service.toLowerCase()}`, type: 'competitor', estimatedSearchVolume: 8200, competitionLevel: 'High', difficultyScore: 85, opportunityScore: 35, trend: 'Stable', intent: 'Commercial' }
            ],
            summary: {
              avgDifficulty: 51,
              avgOpportunity: 70,
              recommendedFocus: [
                `Optimize tags: Include 'custom minimalist ${service.toLowerCase()} agency' in gig tags.`,
                `Improve SEO title: Use 'professional ${service.toLowerCase()}' within first 40 characters.`
              ]
            }
          }
        };
        setActiveRun(mockRun);
        setHistoryList((prev) => [mockRun, ...prev]);
        saveToBackup([mockRun, ...historyList]);
        addToast('Loaded mock keyword metrics (Offline fallback)', 'success');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      await fetch(`${import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_URL || 'http://localhost:3000'}/api/keywords/${id}`, {
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

  const copyKeyword = (keyword: string) => {
    navigator.clipboard.writeText(keyword);
    addToast(`Copied "${keyword}"!`, 'success');
  };

  const handleExportCsv = (run: KeywordRun) => {
    const headers = ['Keyword', 'Type', 'Search Volume', 'Competition', 'Difficulty', 'Opportunity', 'Trend', 'Intent'];
    const rows = [
      ...run.keyword_data.primaryKeywords,
      ...run.keyword_data.longTailKeywords,
      ...run.keyword_data.relatedSearches,
      ...run.keyword_data.competitorKeywords
    ].map(m => [
      m.keyword,
      m.type,
      m.estimatedSearchVolume,
      m.competitionLevel,
      m.difficultyScore,
      m.opportunityScore,
      m.trend,
      m.intent
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `keywords_${run.service.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    addToast('CSV file downloaded!', 'success');
  };

  // Process data for charts
  const allKeywords = activeRun 
    ? [
        ...activeRun.keyword_data.primaryKeywords,
        ...activeRun.keyword_data.longTailKeywords
      ].slice(0, 5)
    : [];

  const maxVolume = allKeywords.length > 0 ? Math.max(...allKeywords.map(k => k.estimatedSearchVolume)) : 100;

  const filteredHistory = historyList.filter(run => 
    run.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 text-slate-700 font-sans">
      {/* Toast Alert stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2 pointer-events-auto animate-slide-in text-xs font-semibold ${
              t.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-400' : 'bg-rose-950/90 border-rose-500/40 text-rose-400'
            }`}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Left Input Configuration Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5  space-y-4">
          <div>
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Keywords Audit</h2>
            <p className="text-[10px] text-slate-500 font-medium">Input your core Fiverr Gig topic to extract optimal primary, long-tail, and competitor keywords.</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Core Service Topic</label>
              <input 
                type="text" 
                required
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g. Next.js Web Development, Logo Design"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fiverr Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="Programming & Tech">Programming & Tech</option>
                <option value="Graphics & Design">Graphics & Design</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="Writing & Translation">Writing & Translation</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-1.5 transition-all"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  Analyzing Fiverr Search Tags...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Analyze Search Keywords
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column Workspace */}
      <div className="lg:col-span-3 flex flex-col min-h-[500px]">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden  flex-1 flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-700">
              {activeRun ? `Results for "${activeRun.service}"` : 'Keywords Results'}
            </span>

            {activeRun && (
              <button 
                onClick={() => handleExportCsv(activeRun)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-white transition-all text-[10px] font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            )}
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {loading ? (
              // Loading Skeletons
              <div className="space-y-4 animate-pulse">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-slate-850 rounded"></div>
                  <div className="h-16 bg-slate-850 rounded"></div>
                </div>
                <div className="h-28 bg-slate-850 rounded"></div>
                <div className="h-40 bg-slate-850 rounded"></div>
              </div>
            ) : activeRun ? (
              <div className="space-y-6 text-xs">
                {/* Metric cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Average Difficulty</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-extrabold text-white">{activeRun.keyword_data.summary.avgDifficulty}%</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        activeRun.keyword_data.summary.avgDifficulty < 40 ? 'bg-green-500/10 text-green-400' :
                        activeRun.keyword_data.summary.avgDifficulty < 70 ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {activeRun.keyword_data.summary.avgDifficulty < 40 ? 'Low Competition' :
                         activeRun.keyword_data.summary.avgDifficulty < 70 ? 'Moderate' : 'Highly Competitive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Opportunity Score</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-extrabold text-emerald-400">{activeRun.keyword_data.summary.avgOpportunity}/100</span>
                      <span className="text-[9px] text-slate-500">A9 algorithm priority</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white border border-slate-850 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">SEO Action Checklist</span>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                    {activeRun.keyword_data.summary.recommendedFocus.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>

                {/* SVG Bar Chart */}
                <div className="bg-white border border-slate-850 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> Est. Search Volume & Difficulty</span>
                    <span className="text-[8px] text-slate-500">Top primary & long-tail targets</span>
                  </div>
                  
                  <div className="pt-2 h-44 w-full flex flex-col justify-between">
                    {allKeywords.map((kw, i) => {
                      const widthPercent = Math.max(10, Math.round((kw.estimatedSearchVolume / maxVolume) * 100));
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-24 truncate text-[10px] text-slate-500 font-mono text-left">{kw.keyword}</div>
                          <div className="flex-1 bg-slate-50 rounded-full h-3 overflow-hidden relative border border-slate-200">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${widthPercent}%` }}
                            />
                            <span className="absolute right-2 top-[-2px] text-[8px] font-bold text-slate-500 font-mono">Vol: {kw.estimatedSearchVolume}</span>
                          </div>
                          <div className="w-12 text-right">
                            <span className={`text-[10px] font-bold ${
                              kw.difficultyScore < 40 ? 'text-green-400' :
                              kw.difficultyScore < 70 ? 'text-yellow-400' :
                              'text-rose-400'
                            }`}>{kw.difficultyScore}% Diff</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed keywords table */}
                <div className="bg-white border border-slate-850 rounded-xl overflow-hidden">
                  <div className="p-3 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Keywords Metric Matrix</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-500 font-bold">
                          <th className="p-3">Keyword</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Volume</th>
                          <th className="p-3">Difficulty</th>
                          <th className="p-3">Intent</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 font-mono text-[11px]">
                        {[
                          ...activeRun.keyword_data.primaryKeywords,
                          ...activeRun.keyword_data.longTailKeywords
                        ].map((m, idx) => (
                          <tr key={idx} className="hover:bg-white text-slate-700">
                            <td className="p-3 font-semibold text-white">{m.keyword}</td>
                            <td className="p-3 text-[10px] capitalize text-slate-500">{m.type.replace('-', ' ')}</td>
                            <td className="p-3 font-bold text-slate-200">{m.estimatedSearchVolume.toLocaleString()}</td>
                            <td className="p-3 font-bold">
                              <span className={
                                m.difficultyScore < 45 ? 'text-green-400' :
                                m.difficultyScore < 70 ? 'text-yellow-400' :
                                'text-rose-400'
                              }>{m.difficultyScore}%</span>
                            </td>
                            <td className="p-3 text-[10px] text-teal-400">{m.intent}</td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => copyKeyword(m.keyword)}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20"
                              >
                                Copy
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              // Empty State
              <div className="text-center py-28 text-slate-500 space-y-3">
                <Search className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold max-w-xs mx-auto">Fill in the service keyword parameters and click search to view volume, difficulty, A9 keyword ranking suggestions, and comparison charts.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History section */}
      <div className="lg:col-span-5 border-t border-slate-200 pt-6 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Past SEO Audit Searches
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Explore your historical keyword searches. Click one to reload its metrics.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {filteredHistory.length > 0 ? (
            <div className="divide-y divide-slate-850">
              {filteredHistory.map((run) => (
                <div key={run.id} className="p-4 hover:bg-slate-50/20 transition-all flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-white">Search: {run.service}</p>
                    <p className="text-[10px] text-slate-500">Searched on {new Date(run.created_at).toLocaleDateString()} · Found {run.keyword_data.primaryKeywords.length + run.keyword_data.longTailKeywords.length} terms</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveRun(run)}
                      className="px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1"
                    >
                      View Report
                    </button>
                    <button 
                      onClick={() => handleDelete(run.id)}
                      className="p-2 rounded bg-slate-50 border border-slate-200 hover:bg-rose-950 hover:text-rose-400 text-slate-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              No saved searches found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
