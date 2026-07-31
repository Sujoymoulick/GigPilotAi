import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Copy, Bookmark, Download, HeartPulse, 
  Trash2, Star, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle, TrendingUp
} from 'lucide-react';

interface Suggestion {
  category: string;
  severity: 'High' | 'Medium' | 'Low';
  issue: string;
  actionableFix: string;
}

interface HealthResult {
  overallScore: number;
  seoScore: number;
  readabilityScore: number;
  ctaScore: number;
  keywordDensityScore: number;
  grammarScore: number;
  trustScore: number;
  conversionScore: number;
  suggestions: Suggestion[];
}

interface HealthRun {
  id: string;
  created_at: string;
  input: {
    title: string;
    description: string;
    faqs?: string;
    packages?: string;
    tags?: string;
  };
  output: HealthResult;
}

export const GigHealthChecker: React.FC = () => {
  const [provider, setProvider] = useState('openai');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [faqs, setFaqs] = useState('');
  const [packages, setPackages] = useState('');
  const [tags, setTags] = useState('');
  
  // Results
  const [loading, setLoading] = useState(false);
  const [activeRun, setActiveRun] = useState<HealthRun | null>(null);
  
  // History & Filters
  const [historyList, setHistoryList] = useState<HealthRun[]>([]);
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
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/gig/health', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        // Hono returns generations - filter for Gig Health Checker
        const list = result.data.filter((g: any) => g.module === 'Gig Health Checker');
        setHistoryList(list);
      }
    } catch {
      const backup = localStorage.getItem('gp_health_backup');
      if (backup) setHistoryList(JSON.parse(backup));
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const saveToBackup = (list: HealthRun[]) => {
    localStorage.setItem('gp_health_backup', JSON.stringify(list));
  };

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/gig/health', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, faqs, packages, tags, provider })
      });
      const result = await res.json();
      if (result.success && result.data) {
        const item = result.data as HealthRun;
        setActiveRun(item);
        setHistoryList((prev) => [item, ...prev]);
        saveToBackup([item, ...historyList]);
        addToast('Gig health audit complete!', 'success');
      } else {
        throw new Error(result.error || 'Server error');
      }
    } catch {
      // Offline fallback
      setTimeout(() => {
        const mockScore = title.length > 40 && description.includes('revisions') ? 88 : 72;
        const mockRun: HealthRun = {
          id: `health_${Date.now()}`,
          created_at: new Date().toISOString(),
          input: { title, description, faqs, packages, tags },
          output: {
            overallScore: mockScore,
            seoScore: 84,
            readabilityScore: 78,
            ctaScore: 75,
            keywordDensityScore: 68,
            grammarScore: 94,
            trustScore: 82,
            conversionScore: 80,
            suggestions: [
              { category: 'SEO Title', severity: 'High', issue: 'Title is missing primary keyword tags.', actionableFix: `Add high volume search terms like 'expert ${title.slice(0, 15)}' to your title.` },
              { category: 'Call to Action', severity: 'Medium', issue: 'No clear checkout instruction inside description footer.', actionableFix: `Add a bold footer: 'Message me before placing an order to discuss custom deliverables!'` },
              { category: 'Keyword Stuffing', severity: 'Low', issue: 'Word frequency count is dense.', actionableFix: 'Replace repeated core words with synonyms to avoid Fiverr spam warnings.' }
            ]
          }
        };
        setActiveRun(mockRun);
        setHistoryList((prev) => [mockRun, ...prev]);
        saveToBackup([mockRun, ...historyList]);
        addToast('Audited gig parameters (Offline fallback)', 'success');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      await fetch(`${import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_URL || 'http://localhost:3000'}/api/history/${id}`, {
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

  const copyReport = (run: HealthRun) => {
    const text = `Gig Health Audit Report: ${run.input.title}\n\nOverall Score: ${run.output.overallScore}%\nSEO: ${run.output.seoScore}%\nReadability: ${run.output.readabilityScore}%\nCTA Score: ${run.output.ctaScore}%\n\nSuggestions:\n${run.output.suggestions.map(s => `- [${s.severity}] ${s.category}: ${s.actionableFix}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    addToast('Audit Report copied!', 'success');
  };

  const getScoreColor = (score: number) => {
    if (score < 50) return 'text-rose-500 border-rose-500/20 bg-rose-500/10';
    if (score < 80) return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10';
    return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
  };

  const getBarColor = (score: number) => {
    if (score < 50) return 'bg-rose-500';
    if (score < 80) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 text-slate-700 font-sans">
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

      {/* Left Input Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5  space-y-4">
          <div>
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Gig Quality Audit</h2>
            <p className="text-[10px] text-slate-500 font-medium">Paste your Fiverr Gig draft copy to perform an A9 algorithm compliance health check.</p>
          </div>

          <form onSubmit={handleAudit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gig Title (starts with 'I will')</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. I will design a modern minimalist startup logo"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gig Description</label>
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste the complete description text..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 h-28"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pricing Tiers (optional)</label>
                <textarea 
                  value={packages}
                  onChange={(e) => setPackages(e.target.value)}
                  placeholder="Basic: $10, Standard: $50..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 h-16"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search Tags / FAQs (optional)</label>
                <textarea 
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="modern-logo, minimal-logo..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 h-16"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-1.5 transition-all"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  Inspecting gig copy...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Perform Gig Audit
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
            <span className="text-xs font-bold text-slate-700">Quality Analysis Workspace</span>

            {activeRun && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => copyReport(activeRun)}
                  className="px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-500 hover:text-white hover:border-slate-700 font-bold flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Report
                </button>
              </div>
            )}
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-slate-850 rounded"></div>
                <div className="h-32 bg-slate-850 rounded"></div>
                <div className="h-28 bg-slate-850 rounded"></div>
              </div>
            ) : activeRun ? (
              <div className="space-y-6 text-xs text-slate-700">
                {/* Overall Score Badge */}
                <div className="flex items-center gap-4 bg-slate-50/50 p-4 border border-slate-850 rounded-xl">
                  <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center font-extrabold text-xl ${getScoreColor(activeRun.output.overallScore)}`}>
                    {activeRun.output.overallScore}%
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Fiverr Gig SEO Compliance</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Calculated based on search queries, CTA hooks, spelling correctness, and keyword stuffings.</p>
                  </div>
                </div>

                {/* Progress bars matrix */}
                <div className="bg-white p-4 border border-slate-850 rounded-xl space-y-3.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Fiverr Compliance Breakdown</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Items */}
                    {[
                      { label: 'SEO tags score', value: activeRun.output.seoScore },
                      { label: 'Description readability', value: activeRun.output.readabilityScore },
                      { label: 'Call to Action (CTA) weight', value: activeRun.output.ctaScore },
                      { label: 'Keyword Density ratio', value: activeRun.output.keywordDensityScore },
                      { label: 'Grammar & spelling', value: activeRun.output.grammarScore },
                      { label: 'Buyer conversion rating', value: activeRun.output.conversionScore }
                    ].map((metric, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-medium text-slate-500">
                          <span>{metric.label}</span>
                          <span className="font-bold text-white">{metric.value}%</span>
                        </div>
                        <div className="w-full bg-slate-50 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${getBarColor(metric.value)}`} 
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fix Suggestions */}
                <div className="bg-white p-4 border border-slate-850 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Actionable fixes required</span>
                  <div className="space-y-3">
                    {activeRun.output.suggestions.map((s, idx) => (
                      <div key={idx} className="p-3 bg-white border border-slate-850 rounded-xl flex gap-3">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          s.severity === 'High' ? 'text-rose-400' :
                          s.severity === 'Medium' ? 'text-yellow-400' : 'text-blue-400'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-[11px]">{s.category}</span>
                            <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              s.severity === 'High' ? 'bg-rose-500/10 text-rose-400' :
                              s.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'
                            }`}>{s.severity}</span>
                          </div>
                          <p className="text-slate-500 mt-1 text-[11px] leading-relaxed">{s.issue}</p>
                          <p className="text-emerald-400 mt-1.5 font-semibold text-[10px] bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10"><strong>Fix:</strong> {s.actionableFix}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-28 text-slate-500 space-y-3">
                <HeartPulse className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold max-w-xs mx-auto">Paste your Fiverr Gig draft copy to perform an A9 algorithm compliance health check.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="lg:col-span-5 border-t border-slate-200 pt-6 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Saved Audits
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Explore your historical Gig health records.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {historyList.length > 0 ? (
            <div className="divide-y divide-slate-850">
              {historyList.map((run) => (
                <div key={run.id} className="p-4 hover:bg-slate-50/20 transition-all flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-white">Gig: {run.input.title}</p>
                    <p className="text-[10px] text-slate-500">Audited on {new Date(run.created_at).toLocaleDateString()} · Overall compliance: {run.output.overallScore}%</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveRun(run)}
                      className="px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1"
                    >
                      Open Report
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
              No saved health audits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
