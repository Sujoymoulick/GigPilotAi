import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Copy, Bookmark, Download, Undo, Redo, 
  HelpCircle, CheckCircle, ChevronDown, Check, ArrowRight, 
  Trash2, Search, Filter, History as HistoryIcon, Star, 
  Edit3, Printer, FileText, ChevronLeft, ChevronRight, X
} from 'lucide-react';

interface Generation {
  id: string;
  created_at: string;
  input: {
    buyerName?: string;
    jobDescription: string;
    myService: string;
    tone: string;
    pricingEstimate?: string;
    deliveryTime?: string;
    type: string;
  };
  output: {
    subjectLine?: string;
    proposalText: string;
    keyHighlights?: string[];
    suggestedQuestions?: string[];
    callToAction?: string;
  };
  isFavorite?: boolean;
}

export const ProposalGenerator: React.FC = () => {
  const [provider, setProvider] = useState('gemini');
  const [proposalType, setProposalType] = useState('buyer_request');
  const [clientName, setClientName] = useState('');
  const [service, setService] = useState('');
  const [requirements, setRequirements] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tone, setTone] = useState('Professional');
  
  // Custom Prompt Template Editor
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [promptTemplate, setPromptTemplate] = useState(
    `You are a high-converting Fiverr proposals & communication expert.\nGenerate a high-impact proposal / response for the following:\n\nType: [TYPE]\nBuyer Name: [BUYER_NAME]\nJob Description: [REQUIREMENTS]\nMy Service: [SERVICE]\nTone: [TONE]\nBudget: [BUDGET]\nDeadline: [DEADLINE]\n\nReturn JSON with subjectLine, proposalText, keyHighlights (array), suggestedQuestions (array), callToAction.`
  );

  // States for output
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeProposal, setActiveProposal] = useState<Generation | null>(null);
  const [proposalText, setProposalText] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [cta, setCta] = useState('');
  
  // Undo/Redo text states
  const [textHistory, setTextHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Version History states
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  // History & Filter states
  const [historyList, setHistoryList] = useState<Generation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Custom Toast state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const outputRef = useRef<HTMLDivElement>(null);

  // Load history from DB
  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/proposals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        setHistoryList(result.data);
      }
    } catch (err) {
      console.warn('Could not fetch proposal history from server, using localStorage backup');
      const backup = localStorage.getItem('gp_proposals_backup');
      if (backup) {
        setHistoryList(JSON.parse(backup));
      }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Keep backup synchronized
  const saveToBackup = (list: Generation[]) => {
    localStorage.setItem('gp_proposals_backup', JSON.stringify(list));
  };

  const handleTextChange = (text: string) => {
    setProposalText(text);
    const newHist = textHistory.slice(0, historyIndex + 1);
    newHist.push(text);
    setTextHistory(newHist);
    setHistoryIndex(newHist.length - 1);
    
    // Auto-save changes periodically
    if (activeProposal) {
      const updatedItem = {
        ...activeProposal,
        output: { ...activeProposal.output, proposalText: text }
      };
      setActiveProposal(updatedItem);
      
      // Auto save to database
      setTimeout(async () => {
        try {
          const token = localStorage.getItem('gp_token') || 'mock-session-token';
          await fetch(`${import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_URL || 'http://localhost:3000'}/api/proposals/${activeProposal.id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ output: updatedItem.output })
          });
        } catch {
          // Silent local backup sync
        }
      }, 1000);
    }
  };

  const triggerUndo = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      setProposalText(textHistory[idx]);
      addToast('Undo performed', 'info');
    }
  };

  const triggerRedo = () => {
    if (historyIndex < textHistory.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setProposalText(textHistory[idx]);
      addToast('Redo performed', 'info');
    }
  };

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        triggerUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        triggerRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && requirements && service) {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, textHistory, requirements, service, clientName, proposalType, tone, provider]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!service || !requirements) {
      addToast('Service and requirements are required!', 'error');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const payload = {
        type: proposalType,
        buyerName: clientName || 'Valued Client',
        jobDescription: requirements,
        myService: service,
        tone: tone,
        pricingEstimate: budget || undefined,
        deliveryTime: deadline || undefined,
        provider,
        promptTemplate: showPromptEditor ? promptTemplate : undefined
      };

      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/proposal/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success && result.data) {
        const item = result.data as Generation;
        loadActiveProposal(item);
        addToast('Proposal generated successfully!', 'success');
        
        // Add to local history list
        setHistoryList((prev) => [item, ...prev]);
        saveToBackup([item, ...historyList]);
        
        // Scroll into output
        setTimeout(() => {
          outputRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        throw new Error(result.error || 'Server error');
      }
    } catch (err: any) {
      console.warn('API generation failed, engaging local mock generator');
      
      // Local simulated response with streaming feel
      setTimeout(() => {
        const simulatedText = `Hi ${clientName || 'there'},\n\nI reviewed your request for: "${requirements.slice(0, 100)}..." and I would love to help you build the best solution.\n\nI am a top-rated freelancer offering high-quality ${service} services. I work with absolute detail and deliver clean assets on time.\n\nTimeline: ${deadline || 'As agreed'}\nBudget: ${budget || 'Competitive pricing'}\n\nLet's connect in inbox to discuss this.`;
        
        const mockItem: Generation = {
          id: `gen_mock_${Date.now()}`,
          created_at: new Date().toISOString(),
          input: {
            buyerName: clientName || 'Valued Client',
            jobDescription: requirements,
            myService: service,
            tone: tone,
            pricingEstimate: budget,
            deliveryTime: deadline,
            type: proposalType
          },
          output: {
            subjectLine: `Fiverr Proposal for ${service}`,
            proposalText: simulatedText,
            keyHighlights: [`Professional ${service} delivery`, 'Fast response & revisions'],
            suggestedQuestions: ['Can we hop on a quick chat to discuss specifications?'],
            callToAction: 'Inbox me for portfolio links.'
          },
          isFavorite: false
        };

        loadActiveProposal(mockItem);
        setHistoryList((prev) => [mockItem, ...prev]);
        saveToBackup([mockItem, ...historyList]);
        addToast('Generated mock backup proposal (Server fallback)', 'info');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveProposal = (item: Generation) => {
    setActiveProposal(item);
    setSubjectLine(item.output.subjectLine || '');
    setProposalText(item.output.proposalText);
    setHighlights(item.output.keyHighlights || []);
    setQuestions(item.output.suggestedQuestions || []);
    setCta(item.output.callToAction || '');
    
    // Reset undo-redo history
    setTextHistory([item.output.proposalText]);
    setHistoryIndex(0);

    // Setup version list
    setVersions((item as any).versions || []);
  };

  const handleFavorite = async (item: Generation) => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/favorites/toggle', {
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
        const updatedList = historyList.map((g) => g.id === item.id ? { ...g, isFavorite: isFav } : g);
        setHistoryList(updatedList);
        saveToBackup(updatedList);
        
        if (activeProposal?.id === item.id) {
          setActiveProposal({ ...activeProposal, isFavorite: isFav });
        }
        addToast(isFav ? 'Added to favorites!' : 'Removed from favorites', 'success');
      }
    } catch {
      // Local offline fallback
      const updatedList = historyList.map((g) => {
        if (g.id === item.id) {
          const isFav = !g.isFavorite;
          return { ...g, isFavorite: isFav };
        }
        return g;
      });
      setHistoryList(updatedList);
      saveToBackup(updatedList);
      if (activeProposal?.id === item.id) {
        setActiveProposal({ ...activeProposal, isFavorite: !activeProposal.isFavorite });
      }
      addToast('Toggled favorite locally', 'info');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      await fetch(`${import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_URL || 'http://localhost:3000'}/api/proposals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}

    const updated = historyList.filter((g) => g.id !== id);
    setHistoryList(updated);
    saveToBackup(updated);
    addToast('Deleted record', 'success');
    if (activeProposal?.id === id) {
      setActiveProposal(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copied content to clipboard!', 'success');
  };

  const handleExportDoc = (title: string, text: string) => {
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>${title}</title><style>body { font-family: Arial, sans-serif; font-size: 11pt; color: #333; line-height: 1.5; }</style></head>
      <body>
        <h2>${title}</h2>
        <p>${text.replace(/\n/g, '<br>')}</p>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal_${title.toLowerCase().replace(/\s+/g, '_')}.doc`;
    a.click();
    addToast('Downloaded DOCX successfully', 'success');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Fiverr Proposal Export</title>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #222; line-height: 1.6; max-width: 650px; margin: 0 auto; }
              h1 { border-bottom: 2px solid #10B981; padding-bottom: 12px; font-size: 20px; color: #111; }
              .meta { font-size: 11px; color: #666; margin-bottom: 30px; }
              .proposal-body { font-size: 14px; white-space: pre-wrap; margin-bottom: 40px; }
              .footer { border-top: 1px solid #eee; padding-top: 12px; font-size: 10px; color: #999; text-align: center; }
            </style>
          </head>
          <body>
            <h1>${subjectLine || 'Fiverr Job Proposal'}</h1>
            <div class="meta">Generated via GigPilot AI on ${new Date().toLocaleDateString()}</div>
            <div class="proposal-body">${proposalText}</div>
            <div class="footer">GigPilot AI - Operating System for Fiverr Freelancers</div>
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Filter lists
  const filteredList = historyList.filter((item) => {
    const matchesSearch = 
      item.input.myService.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.input.jobDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.input.buyerName || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || item.input.type === typeFilter;
    const matchesFavorite = !favoriteFilter || item.isFavorite;

    return matchesSearch && matchesType && matchesFavorite;
  });

  // Paginate list
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 text-slate-700 font-sans">
      {/* Toast Notification Stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2 pointer-events-auto animate-slide-in text-xs font-semibold ${
              t.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-400' :
              t.type === 'error' ? 'bg-rose-950/90 border-rose-500/40 text-rose-400' :
              'bg-slate-50/90 border-slate-200 text-slate-700'
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
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Configure Proposal</h2>
              <select 
                value={provider} 
                onChange={(e) => setProvider(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] text-emerald-400 focus:outline-none"
              >
                <option value="gemini">Gemini Pro</option>
                <option value="openai">GPT-4o mini</option>
                <option value="claude">Claude Sonnet</option>
                <option value="groq">Llama 3 (Fast)</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Generate bulletproof buyer request proposals & client inbox messages.</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Proposal Type</label>
                <select 
                  value={proposalType} 
                  onChange={(e) => setProposalType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="buyer_request">Buyer Request Response</option>
                  <option value="custom_offer">Custom Offer Draft</option>
                  <option value="cold_pitch">Cold Outreach Pitch</option>
                  <option value="follow_up">Follow-Up Message</option>
                  <option value="revision_reply">Revision Reply Text</option>
                  <option value="support">Completion / Thank You</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Client Name (optional)</label>
                <input 
                  type="text" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. David K."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Service Offered</label>
              <input 
                type="text" 
                required
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g. Modern Full-stack Next.js Development"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estimated Budget</label>
                <input 
                  type="text" 
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. $150 USD"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Delivery Deadline</label>
                <input 
                  type="text" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="e.g. 3 Days"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Client Brief & Job Details</label>
              <textarea 
                required
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Paste the buyer request requirements or inbox dialogue context..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Communication Tone</label>
                <select 
                  value={tone} 
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="Professional">Professional & Direct</option>
                  <option value="Friendly">Friendly & Enthusiastic</option>
                  <option value="Persuasive">Highly Persuasive (Sales)</option>
                  <option value="Creative">Creative & Bold</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button 
                  type="button"
                  onClick={() => setShowPromptEditor(!showPromptEditor)}
                  className={`w-full py-2 px-3 border rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    showPromptEditor ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-50 border-slate-850 hover:bg-slate-50 text-slate-500 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Prompt Template
                </button>
              </div>
            </div>

            {showPromptEditor && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">Custom Prompt Layout</span>
                <textarea 
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-[10px] text-slate-700 font-mono h-24 focus:outline-none"
                />
                <span className="text-[8px] text-slate-500">Variables available: [TYPE], [BUYER_NAME], [REQUIREMENTS], [SERVICE], [TONE], [BUDGET], [DEADLINE]</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-1.5 transition-all"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  Generating Proposal Draft...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Generate Winning Proposal
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Preview Output Column */}
      <div ref={outputRef} className="lg:col-span-3 flex flex-col min-h-[500px]">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden  flex-1 flex flex-col">
          {/* Header toolbar */}
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeProposal ? 'bg-emerald-500' : 'bg-slate-700'}`}></span>
              <span className="text-xs font-bold text-slate-700">
                {loading ? 'AI Engine Writing...' : activeProposal ? 'Proposal Output Workspace' : 'Waiting for parameters'}
              </span>
            </div>

            {activeProposal && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={triggerUndo} 
                  disabled={historyIndex <= 0}
                  className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Undo className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={triggerRedo} 
                  disabled={historyIndex >= textHistory.length - 1}
                  className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Redo className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-5 bg-slate-800 mx-1"></div>

                <button 
                  onClick={() => handleFavorite(activeProposal)} 
                  className={`p-1.5 rounded border ${
                    activeProposal.isFavorite 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-white'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>

                <button 
                  onClick={() => copyToClipboard(proposalText)}
                  className="px-2 py-1.5 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:text-white hover:border-slate-700 text-[10px] font-bold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>

                <button 
                  onClick={() => handleExportDoc(subjectLine || 'Proposal', proposalText)}
                  className="px-2 py-1.5 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:text-white hover:border-slate-700 text-[10px] font-bold flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> DOCX
                </button>

                <button 
                  onClick={handlePrint}
                  className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-white"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Area Body */}
          <div className="p-6 flex-1 overflow-y-auto max-h-[500px] space-y-5">
            {loading ? (
              // Loading Skeleton
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-slate-850 rounded w-1/3"></div>
                <div className="h-10 bg-slate-850 rounded"></div>
                <div className="h-4 bg-slate-850 rounded w-1/4 mt-6"></div>
                <div className="space-y-2">
                  <div className="h-3.5 bg-slate-850 rounded"></div>
                  <div className="h-3.5 bg-slate-850 rounded w-[90%]"></div>
                  <div className="h-3.5 bg-slate-850 rounded w-[95%]"></div>
                  <div className="h-3.5 bg-slate-850 rounded w-[75%]"></div>
                </div>
                <div className="h-12 bg-slate-850 rounded w-2/3 mt-6"></div>
              </div>
            ) : activeProposal ? (
              <div className="space-y-5 text-xs text-slate-700">
                {/* Subject / Title */}
                {subjectLine && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-850">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Subject Header</span>
                    <input 
                      type="text" 
                      value={subjectLine} 
                      onChange={(e) => setSubjectLine(e.target.value)}
                      className="w-full bg-transparent font-extrabold text-sm text-white focus:outline-none focus:border-b border-emerald-500/50 pb-0.5"
                    />
                  </div>
                )}

                {/* Edit Area / Rich Text */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-850 space-y-2 relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Proposal Pitch Copy</span>
                    <span className="text-[8px] text-slate-500">Auto-saves to database history</span>
                  </div>
                  
                  <textarea 
                    value={proposalText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full bg-transparent min-h-[220px] focus:outline-none leading-relaxed text-slate-700 font-sans text-xs resize-y"
                    style={{ whiteSpace: 'pre-wrap' }}
                  />
                </div>

                {/* Highlights and Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {highlights.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-850">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">Key Highlights</span>
                      <ul className="list-disc pl-4 space-y-1.5 text-slate-500">
                        {highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {questions.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-850">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">Dialogue Starters</span>
                      <ul className="list-disc pl-4 space-y-1.5 text-slate-500">
                        {questions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Empty State
              <div className="text-center py-24 text-slate-500 space-y-3.5">
                <FileText className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold max-w-xs mx-auto">Fill in the job requirements and click generate to draft a highly persuasive Fiverr proposal using the AI service.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database History Section & Favorites list */}
      <div className="lg:col-span-5 border-t border-slate-200 pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <HistoryIcon className="w-4 h-4 text-emerald-400" /> Saved Proposals & Workspace History
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Explore your generated proposal list, filter by favorite flag or type.</p>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="w-3.5 h-3.5 text-slate-500" />
              </span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..." 
                className="bg-slate-50 border border-slate-850 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-white focus:outline-none"
              />
            </div>

            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-850 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="buyer_request">Buyer Request</option>
              <option value="custom_offer">Custom Offer</option>
              <option value="cold_pitch">Cold Outreach</option>
              <option value="follow_up">Follow Up</option>
              <option value="revision_reply">Revision Reply</option>
            </select>

            <button 
              onClick={() => setFavoriteFilter(!favoriteFilter)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                favoriteFilter 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                  : 'bg-slate-50 border-slate-850 text-slate-500 hover:text-white'
              }`}
            >
              <Star className="w-3 h-3 fill-current" /> Favorites
            </button>
          </div>
        </div>

        {/* History table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden ">
          {paginatedList.length > 0 ? (
            <div className="divide-y divide-slate-850">
              {paginatedList.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-white bg-slate-50 px-2 py-0.5 border border-slate-200 rounded">
                        {item.input.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500">{new Date(item.created_at).toLocaleDateString()}</span>
                      {item.isFavorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />}
                    </div>
                    <p className="text-xs font-bold text-white">For: {item.input.myService}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1 italic">"{item.output.proposalText}"</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => loadActiveProposal(item)}
                      className="px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button 
                      onClick={() => handleFavorite(item)}
                      className="p-2 rounded bg-slate-50 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-white"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded bg-slate-50 border border-slate-200 hover:bg-rose-950 hover:text-rose-400 text-slate-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              No saved proposals matching the filters.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-500 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-500 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
