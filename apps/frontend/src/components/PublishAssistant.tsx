import React, { useState, useEffect } from 'react';
import { 
  Send, Copy, CheckCircle, ExternalLink, RefreshCw, 
  Layers, Check, Sparkles, AlertTriangle, FileText, ChevronRight
} from 'lucide-react';

interface GigDraft {
  id: string;
  title: string;
  category: string;
  content: {
    seoTitle: string;
    description: string;
    packages?: {
      basic?: any;
      standard?: any;
      premium?: any;
    };
    faqs?: any[];
    tags?: string[];
    requirements?: string[];
  };
  status: string;
  created_at: string;
}

export const PublishAssistant: React.FC = () => {
  const [drafts, setDrafts] = useState<GigDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<GigDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  const addToast = (message: string) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/publish/drafts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        setDrafts(result.data);
        if (result.data.length > 0 && !activeDraft) {
          setActiveDraft(result.data[0]);
        }
      }
    } catch {
      // Local backup sync
      const backup = localStorage.getItem('gp_gigs_backup');
      if (backup) {
        const list = JSON.parse(backup);
        setDrafts(list);
        if (list.length > 0 && !activeDraft) setActiveDraft(list[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    addToast(`Copied ${fieldName} to clipboard!`);
  };

  const handleCopyAll = () => {
    if (!activeDraft) return;
    const c = activeDraft.content;
    const fullText = `Title: ${c.seoTitle}\n\nDescription:\n${c.description}\n\nTags: ${c.tags?.join(', ') || ''}\n\nBasic: $${c.packages?.basic?.price || ''} - ${c.packages?.basic?.description || ''}\n\nStandard: $${c.packages?.standard?.price || ''} - ${c.packages?.standard?.description || ''}\n\nPremium: $${c.packages?.premium?.price || ''} - ${c.packages?.premium?.description || ''}`;
    navigator.clipboard.writeText(fullText);
    addToast('Copied full gig parameters!');
  };

  // Perform checklists checks
  const getChecklist = (draft: GigDraft | null) => {
    if (!draft) return [];
    const c = draft.content;
    const titleLength = c.seoTitle?.length || 0;
    const descLength = c.description?.length || 0;
    const tagsCount = c.tags?.length || 0;
    const faqsCount = c.faqs?.length || 0;
    const hasPackages = !!(c.packages?.basic && c.packages?.standard && c.packages?.premium);

    return [
      { id: 'title', label: 'Gig Title under 80 characters', status: titleLength > 10 && titleLength <= 80, info: `${titleLength}/80 chars` },
      { id: 'desc', label: 'Detailed Description (> 120 words)', status: descLength > 120, info: `${descLength} chars` },
      { id: 'tags', label: 'Exactly 5 tags configured', status: tagsCount === 5, info: `${tagsCount}/5 tags` },
      { id: 'packages', label: '3 Pricing packages specified', status: hasPackages, info: hasPackages ? 'Completed' : 'Missing' },
      { id: 'faqs', label: 'At least 1 Gig FAQ added', status: faqsCount >= 1, info: `${faqsCount} FAQs` }
    ];
  };

  const checklist = getChecklist(activeDraft);
  const completedCount = checklist.filter(c => c.status).length;
  const progressPct = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

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

      {/* Left Draft Manager & Compliance Checklist Column */}
      <div className="lg:col-span-2 space-y-4">
        {/* Draft list */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Gig Draft</h2>
            <button onClick={fetchDrafts} className="p-1 rounded hover:bg-slate-850 text-slate-400">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {drafts.length > 0 ? (
              drafts.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDraft(d)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    activeDraft?.id === d.id 
                      ? 'bg-slate-950 border-emerald-500/30 shadow-inner' 
                      : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="truncate pr-4">
                    <p className="text-xs font-bold text-white truncate">{d.content.seoTitle || d.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{d.category} · {new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              ))
            ) : (
              <div className="text-center py-6 text-slate-600 text-[11px]">
                No drafts found. Use 'AI Gig Generator' first to create a gig description!
              </div>
            )}
          </div>
        </div>

        {/* Compliance Checklist */}
        {activeDraft && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Compliance Health Checklist</span>
              <p className="text-[10px] text-slate-500 font-medium">Fiverr seller panel optimization rules analyzer.</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Optimized Score</span>
                <span className="font-bold text-white">{progressPct}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${progressPct === 100 ? 'bg-emerald-500' : 'bg-emerald-500/50'}`} 
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* List */}
            <div className="space-y-3 pt-2">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-start justify-between text-xs gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      item.status ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-slate-800 bg-slate-950 text-transparent'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className={item.status ? 'text-slate-200' : 'text-slate-500'}>{item.label}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-500">{item.info}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column Workspace */}
      <div className="lg:col-span-3 flex flex-col min-h-[500px]">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl flex-1 flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-300">Publish Assistant Workspace</span>

            {activeDraft && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCopyAll}
                  className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white hover:border-slate-700 font-bold flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy All fields
                </button>
                <a 
                  href="https://www.fiverr.com/gigs/new" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10"
                >
                  Open Fiverr Creator <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-5">
            {activeDraft ? (
              <div className="space-y-4 text-xs text-slate-300">
                {/* 1. Title */}
                <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Gig Title</span>
                    <button 
                      onClick={() => handleCopy(activeDraft.content.seoTitle, 'Title')}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-sm font-extrabold text-white">{activeDraft.content.seoTitle}</p>
                </div>

                {/* 2. Category */}
                <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Category Routing</span>
                    <button 
                      onClick={() => handleCopy(activeDraft.category, 'Category')}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="font-bold text-white font-mono text-[10px]">{activeDraft.category} &gt; Custom Setup</p>
                </div>

                {/* 3. Description */}
                <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-855 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Gig Description Pitch</span>
                    <button 
                      onClick={() => handleCopy(activeDraft.content.description, 'Description')}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap text-slate-300">{activeDraft.content.description}</p>
                </div>

                {/* 4. Tags */}
                {activeDraft.content.tags && (
                  <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Search Keywords Tags</span>
                      <button 
                        onClick={() => handleCopy(activeDraft.content.tags?.join(', ') || '', 'Tags')}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        Copy Tags List
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {activeDraft.content.tags.map((tag, i) => (
                        <span key={i} className="bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-lg">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-28 text-slate-500 space-y-3">
                <FileText className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold max-w-xs mx-auto">No draft selected. Please load a draft or run the AI Gig Generator module first to build details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
