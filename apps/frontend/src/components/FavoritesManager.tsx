import React, { useState, useEffect } from 'react';
import { 
  Bookmark, Search, Trash2, Download, Copy, Eye, Star,
  CheckCircle, X, Calendar, Edit3
} from 'lucide-react';

interface FavoriteRecord {
  id: string;
  type: 'generation' | 'template';
  moduleOrType: string;
  title: string;
  content: string;
  payload: Record<string, any>;
  created_at: string;
}

export const FavoritesManager: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState<FavoriteRecord | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  const addToast = (message: string) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        const gens = (result.data.generations || []).map((g: any) => ({
          id: g.id,
          type: 'generation',
          moduleOrType: g.module,
          title: g.output.subjectLine || g.module || 'AI Generation Output',
          content: g.output.proposalText || g.output.replyText || JSON.stringify(g.output),
          payload: g,
          created_at: g.created_at
        }));
        const tmpls = (result.data.templates || []).map((t: any) => ({
          id: t.id,
          type: 'template',
          moduleOrType: t.type,
          title: t.title,
          content: t.content,
          payload: t,
          created_at: t.created_at
        }));

        setFavorites([...gens, ...tmpls]);
      }
    } catch {
      // Local backup sync
      const proposalsBackup = JSON.parse(localStorage.getItem('gp_proposals_backup') || '[]');
      const keywordsBackup = JSON.parse(localStorage.getItem('gp_keywords_backup') || '[]');
      const templatesBackup = JSON.parse(localStorage.getItem('gp_templates_backup') || '[]');

      const gens = proposalsBackup.filter((p: any) => p.isFavorite).map((g: any) => ({
        id: g.id,
        type: 'generation',
        moduleOrType: g.input.type || 'Proposal',
        title: g.output.subjectLine || 'Fiverr Proposal Output',
        content: g.output.proposalText,
        payload: g,
        created_at: g.created_at
      }));

      const tmpls = templatesBackup.filter((t: any) => t.isFavorite).map((t: any) => ({
        id: t.id,
        type: 'template',
        moduleOrType: t.type,
        title: t.title,
        content: t.content,
        payload: t,
        created_at: t.created_at
      }));

      setFavorites([...gens, ...tmpls]);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (item: FavoriteRecord) => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/favorites/toggle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: item.type, id: item.id })
      });
      const result = await res.json();
      if (result.success) {
        setFavorites((prev) => prev.filter(f => f.id !== item.id));
        addToast('Removed from favorites!');
      }
    } catch {
      setFavorites((prev) => prev.filter(f => f.id !== item.id));
      addToast('Removed from favorites locally');
    }
    if (activeItem?.id === item.id) setActiveItem(null);
  };

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copied content to clipboard!');
  };

  const downloadJson = (item: FavoriteRecord) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item.payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `favorite_${item.type}_${item.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('JSON exported successfully!');
  };

  const filteredFavorites = favorites.filter((item) => {
    const term = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      item.content.toLowerCase().includes(term) ||
      item.moduleOrType.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-7xl w-full mx-auto space-y-6 text-slate-700 font-sans">
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

      {/* Top Filter Search Toolbar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex justify-between items-center gap-4">
        <div className="relative max-w-xs w-full">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-slate-500" />
          </span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved favorites..." 
            className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-slate-850 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <span className="text-[10px] text-slate-500 font-bold uppercase">{filteredFavorites.length} saved items</span>
      </div>

      {/* Main layout list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFavorites.length > 0 ? (
          filteredFavorites.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/30 hover:shadow-md transition-all duration-300 space-y-3.5">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[8px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                    {item.moduleOrType}
                  </span>
                  <span className="text-[9px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-slate-800 text-xs line-clamp-1" title={item.title}>{item.title}</h3>
                <p className="text-[10px] text-slate-505 line-clamp-3 mt-2 leading-relaxed">"{item.content}"</p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setActiveItem(item)}
                    className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Inspect"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => downloadJson(item)}
                    className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Export"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleRemove(item)}
                    className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                    title="Remove Favorite"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <button 
                  onClick={() => copyContent(item.content)}
                  className="px-2.5 py-1 rounded-full bg-[#8DE55A] hover:bg-[#7ad34a] text-slate-900 text-[9px] font-extrabold shadow-sm active:scale-95 transition-all duration-200"
                >
                  Copy Text
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="lg:col-span-3 text-center py-20 text-slate-500 text-xs">
            No favorite items stored. Toggle the bookmark/favorite icons in any workspace tools to save layouts.
          </div>
        )}
      </div>

      {/* Inspector Details Drawer Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Inspect Favorite detail ({activeItem.moduleOrType})
              </span>
              <button onClick={() => setActiveItem(null)} className="text-slate-500 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Content Body</span>
                <p className="leading-relaxed whitespace-pre-wrap text-slate-700 font-sans text-xs">{activeItem.content}</p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Metadata Payload</span>
                <pre className="bg-slate-55 p-3.5 rounded-xl border border-slate-200 overflow-x-auto text-[10px] font-mono text-slate-700">
                  {JSON.stringify(activeItem.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
              <button 
                onClick={() => copyContent(activeItem.content)}
                className="px-3 py-1.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-bold flex items-center gap-1 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Text
              </button>
              <button 
                onClick={() => downloadJson(activeItem)}
                className="px-3 py-1.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-bold flex items-center gap-1 transition-colors"
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
