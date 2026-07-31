import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Copy, Bookmark, MessageSquare, 
  Trash2, Star, CheckCircle, ChevronLeft, ChevronRight, Send, HelpCircle
} from 'lucide-react';

interface Generation {
  id: string;
  created_at: string;
  input: {
    type: string;
    clientMessage: string;
    context?: string;
  };
  output: {
    replyText: string;
    tone: string;
    alternativeOptions?: string[];
  };
  isFavorite?: boolean;
}

export const ClientReplyGenerator: React.FC = () => {
  const [provider, setProvider] = useState('openai');
  const [replyType, setReplyType] = useState('professional');
  const [clientMessage, setClientMessage] = useState('');
  const [context, setContext] = useState('');
  
  // Results
  const [loading, setLoading] = useState(false);
  const [activeReply, setActiveReply] = useState<Generation | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // History & Filters
  const [historyList, setHistoryList] = useState<Generation[]>([]);
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
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        setHistoryList(result.data);
      }
    } catch {
      const backup = localStorage.getItem('gp_messages_backup');
      if (backup) setHistoryList(JSON.parse(backup));
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const saveToBackup = (list: Generation[]) => {
    localStorage.setItem('gp_messages_backup', JSON.stringify(list));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientMessage) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/messages/reply', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: replyType, clientMessage, context, provider })
      });
      const result = await res.json();
      if (result.success && result.data) {
        const item = result.data as Generation;
        setActiveReply(item);
        setReplyText(item.output.replyText);
        setHistoryList((prev) => [item, ...prev]);
        saveToBackup([item, ...historyList]);
        addToast('Reply drafted successfully!', 'success');
      } else {
        throw new Error(result.error || 'Server error');
      }
    } catch {
      // Offline fallback
      setTimeout(() => {
        let simulatedText = '';
        let alts: string[] = [];
        
        if (replyType === 'refund') {
          simulatedText = `Hi there,\n\nI understand your concern and am sorry the delivery didn't meet expectations. I have initiated a full refund for this order immediately. Please let me know if you have any questions.\n\nBest regards,\nAlex`;
          alts = [`Hello, I have refunded your order as requested. Sorry for any inconvenience caused.`];
        } else if (replyType === 'upsell') {
          simulatedText = `Hi there, thank you for the details! To achieve the absolute best results for this layout, I recommend adding our Vector Source Files & Commercial Rights upgrade. This will unlock scaling capabilities. I can add this for an extra $35. Would you like me to send a custom offer?\n\nBest,\nAlex`;
          alts = [`Hi, I can add source files and commercial licensing for an additional $35. Let me know if you would like me to set this up!`];
        } else if (replyType === 'revision') {
          simulatedText = `Hi there, thank you for the feedback! I've noted the request for adjustments. I am working on the revisions now and will deliver the updated assets in the next few hours.\n\nBest,\nAlex`;
          alts = [`Hello, revisions noted! I am on it and will send the update shortly.`];
        } else {
          simulatedText = `Hi there,\n\nThank you for getting in touch! I have reviewed your request for details and would be glad to assist you. I've prepared a custom order package below. Let's get started!\n\nBest,\nAlex`;
          alts = [`Hello, thanks for writing! I've checked the files and am ready to start. Let's place the order!`];
        }

        const mockItem: Generation = {
          id: `msg_${Date.now()}`,
          created_at: new Date().toISOString(),
          input: { type: replyType, clientMessage, context },
          output: {
            replyText: simulatedText,
            tone: replyType,
            alternativeOptions: alts
          }
        };

        setActiveReply(mockItem);
        setReplyText(simulatedText);
        setHistoryList((prev) => [mockItem, ...prev]);
        saveToBackup([mockItem, ...historyList]);
        addToast('Drafted offline reply (Fallback mode)', 'success');
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
    if (activeReply?.id === id) setActiveReply(null);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Reply copied!', 'success');
  };

  // Quick reply templates helper
  const quickTemplates = [
    { title: 'Welcome Greeting', text: `Hi there! Thank you for placing the order. I have received all your requirements and will review them shortly. Looking forward to working with you!` },
    { title: 'Milestone Update', text: `Hi there, just wanted to let you know that I've completed the initial layout draft. I am now polishing the style guidelines. I will deliver the files on schedule!` },
    { title: 'Completion Delivery', text: `Hi there, I am glad to deliver the final outputs for your review. Please inspect the files attached. If everything looks perfect, kindly approve the delivery. Thank you!` }
  ];

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

      {/* Left Input Configuration Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5  space-y-4">
          <div>
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Reply Config</h2>
            <p className="text-[10px] text-slate-500 font-medium">Input client questions or complaints to formulate professional, high-conversion responses.</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Scenario Type</label>
              <select 
                value={replyType} 
                onChange={(e) => setReplyType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="professional">Professional / General Reply</option>
                <option value="friendly">Friendly Greeting / Welcome</option>
                <option value="upsell">Upsell Source Files & License</option>
                <option value="revision">Revision Feedback Response</option>
                <option value="delay">Order Delay Explanation</option>
                <option value="refund">Cancellation / Refund Reply</option>
                <option value="thank_you">Order Complete / Thank You</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Client Message</label>
              <textarea 
                required
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
                placeholder="Paste what the buyer wrote to you..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 h-24"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Additional Context / Instructions (optional)</label>
              <textarea 
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. 'Politely deny the refund request but offer 1 extra revision', 'Upsell source files for $25'..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 h-20"
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
                  Formulating message response...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Generate Professional Reply
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Canned Replies */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5  space-y-3">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Fiverr Quick Reply Templates</span>
          <div className="space-y-2">
            {quickTemplates.map((t, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-850 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-[10px]">{t.title}</span>
                  <button 
                    onClick={() => copyText(t.text)}
                    className="text-[9px] text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column Workspace */}
      <div className="lg:col-span-3 flex flex-col min-h-[500px]">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden  flex-1 flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-700">Draft Editor Workspace</span>

            {activeReply && (
              <button 
                onClick={() => copyText(replyText)}
                className="px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-500 hover:text-white hover:border-slate-700 font-bold flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Message
              </button>
            )}
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-40 bg-slate-850 rounded"></div>
                <div className="h-10 bg-slate-850 rounded w-1/3"></div>
                <div className="h-24 bg-slate-850 rounded"></div>
              </div>
            ) : activeReply ? (
              <div className="space-y-5 text-xs text-slate-700">
                {/* Main draft text */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-855 space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Generated Response copy</span>
                    <span className="text-[9px] text-slate-500 capitalize">Tone: {activeReply.input.type}</span>
                  </div>
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-transparent min-h-[180px] focus:outline-none leading-relaxed text-slate-700 font-sans text-xs resize-y"
                    style={{ whiteSpace: 'pre-wrap' }}
                  />
                </div>

                {/* Alternatives */}
                {activeReply.output.alternativeOptions && activeReply.output.alternativeOptions.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">Alternative phrasing variations</span>
                    {activeReply.output.alternativeOptions.map((alt, idx) => (
                      <div key={idx} className="p-3 bg-slate-50/50 border border-slate-850 rounded-xl space-y-2">
                        <p className="leading-relaxed text-slate-500 italic">"{alt}"</p>
                        <button 
                          onClick={() => { setReplyText(alt); addToast('Loaded variation into workspace!', 'success'); }}
                          className="text-[9px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                        >
                          Use this version
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-28 text-slate-500 space-y-3">
                <MessageSquare className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="text-xs font-semibold max-w-xs mx-auto">Fill in the client message details on the left to draft professional, high-conversion support replies.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="lg:col-span-5 border-t border-slate-200 pt-6 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-400" /> Historical Client Messages
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Browse past communication drafts generated in this workspace.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {historyList.length > 0 ? (
            <div className="divide-y divide-slate-850">
              {historyList.map((run) => (
                <div key={run.id} className="p-4 hover:bg-slate-50/20 transition-all flex items-center justify-between gap-4">
                  <div className="max-w-xl">
                    <p className="text-xs font-bold text-white">Scenario: {run.input.type.toUpperCase()}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1 italic">Client: "{run.input.clientMessage}"</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setActiveReply(run); setReplyText(run.output.replyText); }}
                      className="px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1"
                    >
                      Open Draft
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
              No saved client reply message drafts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
