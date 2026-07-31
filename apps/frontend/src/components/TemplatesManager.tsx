import React, { useState, useEffect } from 'react';
import { 
  Library, Search, Plus, Copy, Bookmark, Trash2, Edit3, 
  Download, Upload, CheckCircle, Star, Grid, List, X
} from 'lucide-react';

interface TemplateRecord {
  id: string;
  title: string;
  category: string;
  type: 'gig' | 'proposal' | 'bio' | 'reply' | 'contract' | 'invoice';
  content: string;
  isCustom: boolean;
  isFavorite: boolean;
}

export const TemplatesManager: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<string>('all');
  
  // Modal State for editing/creating
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRecord | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalType, setModalType] = useState<'gig' | 'proposal' | 'bio' | 'reply' | 'contract' | 'invoice'>('gig');
  const [modalCategory, setModalCategory] = useState('Programming & Tech');

  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  const addToast = (message: string) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        setTemplates(result.data);
      }
    } catch {
      const backup = localStorage.getItem('gp_templates_backup');
      if (backup) setTemplates(JSON.parse(backup));
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const saveToBackup = (list: TemplateRecord[]) => {
    localStorage.setItem('gp_templates_backup', JSON.stringify(list));
  };

  const handleOpenEdit = (tmpl: TemplateRecord) => {
    setEditingTemplate(tmpl);
    setModalTitle(tmpl.title);
    setModalContent(tmpl.content);
    setModalType(tmpl.type);
    setModalCategory(tmpl.category);
    setShowModal(true);
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setModalTitle('');
    setModalContent('');
    setModalType('gig');
    setModalCategory('Programming & Tech');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle || !modalContent) return;

    const token = localStorage.getItem('gp_token') || 'mock-session-token';
    
    if (editingTemplate) {
      // Edit
      try {
        const res = await fetch(`${import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_URL || 'http://localhost:3000'}/api/templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: modalTitle,
            content: modalContent,
            type: modalType,
            category: modalCategory
          })
        });
        const result = await res.json();
        if (result.success && result.data) {
          const updated = templates.map(t => t.id === editingTemplate.id ? result.data : t);
          setTemplates(updated);
          saveToBackup(updated);
          addToast('Template updated successfully!');
        }
      } catch {
        const updated = templates.map(t => t.id === editingTemplate.id 
          ? { ...t, title: modalTitle, content: modalContent, type: modalType, category: modalCategory } 
          : t
        );
        setTemplates(updated);
        saveToBackup(updated);
        addToast('Template updated offline!');
      }
    } else {
      // Create
      try {
        const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/templates', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: modalTitle,
            content: modalContent,
            type: modalType,
            category: modalCategory
          })
        });
        const result = await res.json();
        if (result.success && result.data) {
          const updated = [result.data, ...templates];
          setTemplates(updated);
          saveToBackup(updated);
          addToast('Template created successfully!');
        }
      } catch {
        const newTmpl: TemplateRecord = {
          id: `tmpl_${Date.now()}`,
          title: modalTitle,
          content: modalContent,
          type: modalType,
          category: modalCategory,
          isCustom: true,
          isFavorite: false
        };
        const updated = [newTmpl, ...templates];
        setTemplates(updated);
        saveToBackup(updated);
        addToast('Template created offline!');
      }
    }
    setShowModal(false);
  };

  const handleDuplicate = async (tmpl: TemplateRecord) => {
    const token = localStorage.getItem('gp_token') || 'mock-session-token';
    const duplicatedTitle = `${tmpl.title} (Copy)`;
    
    try {
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/templates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: duplicatedTitle,
          content: tmpl.content,
          type: tmpl.type,
          category: tmpl.category
        })
      });
      const result = await res.json();
      if (result.success && result.data) {
        const updated = [result.data, ...templates];
        setTemplates(updated);
        saveToBackup(updated);
        addToast('Template duplicated successfully!');
      }
    } catch {
      const newTmpl: TemplateRecord = {
        id: `tmpl_${Date.now()}`,
        title: duplicatedTitle,
        content: tmpl.content,
        type: tmpl.type,
        category: tmpl.category,
        isCustom: true,
        isFavorite: false
      };
      const updated = [newTmpl, ...templates];
      setTemplates(updated);
      saveToBackup(updated);
      addToast('Duplicated locally!');
    }
  };

  const handleFavorite = async (tmpl: TemplateRecord) => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/favorites/toggle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'template', id: tmpl.id })
      });
      const result = await res.json();
      if (result.success) {
        const isFav = result.isFavorite;
        const updated = templates.map(t => t.id === tmpl.id ? { ...t, isFavorite: isFav } : t);
        setTemplates(updated);
        saveToBackup(updated);
        addToast(isFav ? 'Added to favorites!' : 'Removed from favorites');
      }
    } catch {
      const updated = templates.map(t => t.id === tmpl.id ? { ...t, isFavorite: !t.isFavorite } : t);
      setTemplates(updated);
      saveToBackup(updated);
      addToast('Toggled favorite locally');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      await fetch(`${import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_URL || 'http://localhost:3000'}/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {}
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveToBackup(updated);
    addToast('Template deleted successfully!');
  };

  const copyTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Template content copied!');
  };

  const exportTemplate = (tmpl: TemplateRecord) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tmpl, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `template_${tmpl.title.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Template file exported!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = e => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (parsed.title && parsed.content && parsed.type) {
            const newTmpl: TemplateRecord = {
              id: `tmpl_imp_${Date.now()}`,
              title: parsed.title,
              content: parsed.content,
              type: parsed.type,
              category: parsed.category || 'Programming & Tech',
              isCustom: true,
              isFavorite: false
            };
            const updated = [newTmpl, ...templates];
            setTemplates(updated);
            saveToBackup(updated);
            addToast('Imported template successfully!');
          } else {
            addToast('Invalid template file structure');
          }
        } catch {
          addToast('Could not parse template JSON');
        }
      };
    }
  };

  const filteredTemplates = templates.filter((tmpl) => {
    const matchesSearch = 
      tmpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = activeType === 'all' || tmpl.type === activeType;
    return matchesSearch && matchesType;
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-4 rounded-2xl ">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-slate-500" />
            </span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..." 
              className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-slate-800 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <select 
            value={activeType} 
            onChange={(e) => setActiveType(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="gig">Gig Descriptions</option>
            <option value="proposal">Custom Proposals</option>
            <option value="bio">Bio Layouts</option>
            <option value="reply">Client Messages</option>
            <option value="contract">Contracts</option>
            <option value="invoice">Invoices</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Hidden Import file */}
          <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-[10px] font-bold cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5" /> Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10"
          >
            <Plus className="w-3.5 h-3.5" /> Create Template
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((tmpl) => (
            <div key={tmpl.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/30 hover:shadow-md transition-all duration-300 space-y-3.5">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[8px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                    {tmpl.type}
                  </span>
                  <button 
                    onClick={() => handleFavorite(tmpl)} 
                    className={`text-slate-400 hover:text-slate-700 ${tmpl.isFavorite ? 'text-amber-500' : ''}`}
                  >
                    <Star className={`w-3.5 h-3.5 ${tmpl.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <h3 className="font-bold text-slate-800 text-xs line-clamp-1" title={tmpl.title}>{tmpl.title}</h3>
                <p className="text-[9px] text-slate-400">{tmpl.category}</p>
                <p className="text-[10px] text-slate-500 line-clamp-3 mt-2 leading-relaxed">"{tmpl.content}"</p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenEdit(tmpl)}
                    className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleDuplicate(tmpl)}
                    className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => exportTemplate(tmpl)}
                    className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Export"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleDelete(tmpl.id)}
                    className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <button 
                  onClick={() => copyTemplate(tmpl.content)}
                  className="px-2.5 py-1 rounded-full bg-[#8DE55A] hover:bg-[#7ad34a] text-slate-900 text-[9px] font-extrabold shadow-sm active:scale-95 transition-all duration-200"
                >
                  Copy Template
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="lg:col-span-3 text-center py-20 text-slate-500 text-xs">
            No templates matching search or filters. Click Create Template to add a new custom copy.
          </div>
        )}
      </div>

      {/* Editor Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {editingTemplate ? 'Edit Template' : 'Create Custom Template'}
              </span>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Template Title</label>
                <input 
                  type="text" 
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Winner Cold Proposal Setup"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Template Type</label>
                  <select 
                    value={modalType} 
                    onChange={(e) => setModalType(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="gig">Gig Description</option>
                    <option value="proposal">Custom Proposal</option>
                    <option value="bio">Bio Layout</option>
                    <option value="reply">Client Message</option>
                    <option value="contract">Contract</option>
                    <option value="invoice">Invoice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                  <input 
                    type="text" 
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value)}
                    placeholder="e.g. Programming & Tech"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Template Content Copy</label>
                <textarea 
                  required
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  placeholder="Type or paste template contents..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 h-40 leading-relaxed"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5"
              >
                Save Template
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
