import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Copy, Bookmark, Download, Briefcase, 
  Trash2, Star, CheckCircle, ChevronLeft, ChevronRight, Eye, LayoutGrid
} from 'lucide-react';

interface CaseStudy {
  title: string;
  problem: string;
  solution: string;
  outcome: string;
}

interface ProjectDescription {
  title: string;
  description: string;
  tags: string[];
}

interface Testimonial {
  clientName: string;
  quote: string;
  rating: number;
}

interface PortfolioResult {
  aboutMe: string;
  caseStudies: CaseStudy[];
  projectDescriptions: ProjectDescription[];
  testimonials: Testimonial[];
  portfolioWebsiteCopy: string;
  linkedInAbout: string;
}

interface PortfolioRun {
  id: string;
  created_at: string;
  role: string;
  portfolio_data: PortfolioResult;
}

export const PortfolioBuilder: React.FC = () => {
  const [provider, setProvider] = useState('openai');
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState('');
  const [pastProjects, setPastProjects] = useState('');
  
  // Results
  const [loading, setLoading] = useState(false);
  const [activeRun, setActiveRun] = useState<PortfolioRun | null>(null);
  const [activeTab, setActiveTab] = useState('aboutme');
  
  // History & Filters
  const [historyList, setHistoryList] = useState<PortfolioRun[]>([]);
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
      const res = await fetch('http://localhost:3000/api/portfolio', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        setHistoryList(result.data);
      }
    } catch {
      const backup = localStorage.getItem('gp_portfolio_backup');
      if (backup) setHistoryList(JSON.parse(backup));
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const saveToBackup = (list: PortfolioRun[]) => {
    localStorage.setItem('gp_portfolio_backup', JSON.stringify(list));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !skills) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch('http://localhost:3000/api/portfolio/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role, skills: skills.split(',').map(s => s.trim()), pastProjects, provider })
      });
      const result = await res.json();
      if (result.success && result.data) {
        const item = result.data as PortfolioRun;
        setActiveRun(item);
        setHistoryList((prev) => [item, ...prev]);
        saveToBackup([item, ...historyList]);
        addToast('Portfolio structure generated!', 'success');
      } else {
        throw new Error(result.error || 'Server error');
      }
    } catch {
      // Offline fallback
      setTimeout(() => {
        const mockRun: PortfolioRun = {
          id: `port_${Date.now()}`,
          created_at: new Date().toISOString(),
          role,
          portfolio_data: {
            aboutMe: `I am an expert ${role} specialized in building modular high converting layouts. With years of experience working with tools like ${skills}, I assist startups in scaling digital revenue operations.`,
            caseStudies: [
              {
                title: 'E-commerce Brand Growth Hack',
                problem: 'Startup store conversion rates were lagging below 1.5% average due to complex layouts.',
                solution: `Implemented an optimized modular design built with React and Tailwind UI elements.`,
                outcome: 'Site loading times decreased by 60% and checkout conversion raised to 4.2% average.'
              }
            ],
            projectDescriptions: [
              {
                title: 'Responsive Developer Console',
                description: 'A modern styled developer dashboard utilizing custom widgets and dark styling.',
                tags: skills.split(',').map(s => s.trim())
              }
            ],
            testimonials: [
              { clientName: 'Sarah Jenkins', quote: 'Delivered an exceptional codebase that was clean and easy to maintain.', rating: 5 }
            ],
            portfolioWebsiteCopy: `Header: I will design custom scalable web products\nSubheader: Build blazing-fast applications optimized for conversion.`,
            linkedInAbout: `Dedicated ${role} focused on React, TypeScript and responsive layout design. Helper of startups looking to construct high-intent user interfaces.`
          }
        };
        setActiveRun(mockRun);
        setHistoryList((prev) => [mockRun, ...prev]);
        saveToBackup([mockRun, ...historyList]);
        addToast('Generated simulated portfolio copy (Offline fallback)', 'success');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      await fetch(`http://localhost:3000/api/portfolio/${id}`, {
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

  const copyTabContent = () => {
    if (!activeRun) return;
    let text = '';
    const data = activeRun.portfolio_data;
    if (activeTab === 'aboutme') text = `About Me:\n${data.aboutMe}\n\nLinkedIn:\n${data.linkedInAbout}`;
    else if (activeTab === 'casestudies') text = data.caseStudies.map(c => `Title: ${c.title}\nProblem: ${c.problem}\nSolution: ${c.solution}\nOutcome: ${c.outcome}`).join('\n\n');
    else if (activeTab === 'projects') text = data.projectDescriptions.map(p => `Project: ${p.title}\nDescription: ${p.description}\nTags: ${p.tags.join(', ')}`).join('\n\n');
    else if (activeTab === 'web') text = data.portfolioWebsiteCopy;

    navigator.clipboard.writeText(text);
    addToast('Copied section to clipboard!', 'success');
  };

  const exportAsFile = (format: 'md' | 'html' | 'doc') => {
    if (!activeRun) return;
    const data = activeRun.portfolio_data;
    let content = '';
    let fileName = `portfolio_${activeRun.role.toLowerCase().replace(/\s+/g, '_')}`;

    if (format === 'md') {
      content = `# ${activeRun.role} Portfolio\n\n## About Me\n${data.aboutMe}\n\n## Case Studies\n${data.caseStudies.map(c => `### ${c.title}\n**Problem:** ${c.problem}\n**Solution:** ${c.solution}\n**Outcome:** ${c.outcome}`).join('\n\n')}\n\n## Website Copy\n${data.portfolioWebsiteCopy}`;
      fileName += '.md';
    } else if (format === 'html') {
      content = `<html><body><h1>${activeRun.role} Portfolio</h1><h2>About Me</h2><p>${data.aboutMe}</p><h2>Case Studies</h2>${data.caseStudies.map(c => `<h3>${c.title}</h3><p><b>Problem:</b> ${c.problem}</p><p><b>Solution:</b> ${c.solution}</p><p><b>Outcome:</b> ${c.outcome}</p>`).join('')}</body></html>`;
      fileName += '.html';
    } else {
      content = `<html><body><h2>${activeRun.role} Portfolio</h2><h3>About Me</h3><p>${data.aboutMe}</p></body></html>`;
      fileName += '.doc';
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    addToast(`Downloaded ${format.toUpperCase()} file!`, 'success');
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

      {/* Left Input Configuration Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
          <div>
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Portfolio Configuration</h2>
            <p className="text-[10px] text-slate-500 font-medium">Input your skills and experience to build high-converting landing page layouts and bio details.</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Freelance Role / Speciality</label>
              <input 
                type="text" 
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Next.js Full-Stack Developer"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Key Skills (comma-separated)</label>
              <input 
                type="text" 
                required
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Next.js, Supabase, Tailwind CSS"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Past Projects / Custom Context (optional)</label>
              <textarea 
                value={pastProjects}
                onChange={(e) => setPastProjects(e.target.value)}
                placeholder="E-commerce startup site rebrand, responsive SaaS portal design..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 h-20"
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
                  Generating portfolio copy...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Build Portfolio Copy
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
            <span className="text-xs font-bold text-slate-300">Portfolio Copy Layout</span>

            {activeRun && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={copyTabContent}
                  className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white hover:border-slate-700 font-bold flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Tab
                </button>
                <select 
                  onChange={(e) => exportAsFile(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 font-bold focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>Export Copy...</option>
                  <option value="md">Markdown (.md)</option>
                  <option value="html">HTML Layout</option>
                  <option value="doc">MS Word (.doc)</option>
                </select>
              </div>
            )}
          </div>

          {activeRun && (
            /* Tabs bar */
            <div className="flex bg-slate-950/60 border-b border-slate-850 px-4">
              {[
                { id: 'aboutme', label: 'About & LinkedIn' },
                { id: 'casestudies', label: 'Case Studies' },
                { id: 'projects', label: 'Project description' },
                { id: 'web', label: 'Website copy' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-[10px] font-bold uppercase border-b-2 transition-all ${
                    activeTab === tab.id 
                      ? 'border-emerald-500 text-white bg-slate-900/40' 
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-24 bg-slate-850 rounded"></div>
                <div className="h-10 bg-slate-850 rounded w-1/2"></div>
                <div className="h-28 bg-slate-850 rounded"></div>
              </div>
            ) : activeRun ? (
              <div className="space-y-5 text-xs text-slate-300">
                {activeTab === 'aboutme' && (
                  <div className="space-y-5">
                    <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Bio Description (About Me)</span>
                      <p className="leading-relaxed whitespace-pre-wrap text-slate-300">{activeRun.portfolio_data.aboutMe}</p>
                    </div>

                    <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">LinkedIn About section Copy</span>
                      <p className="leading-relaxed whitespace-pre-wrap text-slate-300">{activeRun.portfolio_data.linkedInAbout}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'casestudies' && (
                  <div className="space-y-4">
                    {activeRun.portfolio_data.caseStudies.map((c, idx) => (
                      <div key={idx} className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl space-y-3">
                        <span className="font-bold text-white text-sm block border-b border-slate-900 pb-2">{c.title}</span>
                        <div className="space-y-2">
                          <p className="text-slate-400"><strong>Problem:</strong> {c.problem}</p>
                          <p className="text-slate-400"><strong>Solution:</strong> {c.solution}</p>
                          <p className="text-emerald-400 bg-emerald-500/5 px-2 py-1.5 rounded border border-emerald-500/10 mt-1"><strong>Outcome:</strong> {c.outcome}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="space-y-4">
                    {activeRun.portfolio_data.projectDescriptions.map((p, idx) => (
                      <div key={idx} className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl space-y-2">
                        <span className="font-bold text-white text-sm block">{p.title}</span>
                        <p className="leading-relaxed text-slate-400">{p.description}</p>
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {p.tags.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'web' && (
                  <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Website Hero / landing Copy</span>
                    <pre className="leading-relaxed whitespace-pre-wrap text-slate-300 font-sans">{activeRun.portfolio_data.portfolioWebsiteCopy}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-28 text-slate-500 space-y-3">
                <Briefcase className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold max-w-xs mx-auto">Fill in the role and skills criteria and click generate to build high-converting case studies and portfolio copy blocks.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History section */}
      <div className="lg:col-span-5 border-t border-slate-800/80 pt-6 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4 text-emerald-400" /> Saved Portfolios
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Reload saved portfolio copy sets.</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden">
          {historyList.length > 0 ? (
            <div className="divide-y divide-slate-850">
              {historyList.map((run) => (
                <div key={run.id} className="p-4 hover:bg-slate-950/20 transition-all flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-white">Role: {run.role}</p>
                    <p className="text-[10px] text-slate-500">Created on {new Date(run.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setActiveRun(run); setActiveTab('aboutme'); }}
                      className="px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Assets
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
              No saved portfolios found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
