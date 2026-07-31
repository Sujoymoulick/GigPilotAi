import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, Video, FileText, Trash2, Search, UploadCloud, 
  Folder, FolderOpen, Tag, Plus, RefreshCw, Eye, Download, Info, AlertCircle, CheckCircle2 
} from 'lucide-react';

interface MediaItem {
  id: string;
  type: string;
  url: string;
  filename: string;
  size: number;
  created_at: string;
}

export const MediaManager: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<{ id: string; message: string; type?: 'success' | 'error' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const loadMedia = async () => {
    setLoading(true);
    try {
      const gpToken = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/media', {
        headers: { 'Authorization': `Bearer ${gpToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
      }
    } catch {
      showToast('Failed to load media items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUpload = async (filename?: string, type?: string) => {
    showToast('Uploading file...');
    try {
      const gpToken = localStorage.getItem('gp_token') || 'mock-session-token';
      
      const fileNames = ['launch_banner.jpg', 'analytics_screenshot.png', 'promotional_video.mp4', 'client_onboarding.pdf'];
      const fileTypes = ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'];
      const pickIdx = Math.floor(Math.random() * fileNames.length);

      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gpToken}`
        },
        body: JSON.stringify({
          filename: filename || fileNames[pickIdx],
          type: type || fileTypes[pickIdx],
          url: fileTypes[pickIdx].startsWith('video') 
            ? 'https://www.w3schools.com/html/mov_bbb.mp4' 
            : fileTypes[pickIdx].startsWith('application')
              ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
              : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          size: Math.floor(100000 + Math.random() * 9000000)
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Successfully uploaded media file!');
        loadMedia();
      }
    } catch {
      showToast('Media upload failed', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const gpToken = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_URL || 'http://localhost:3000'}/api/social/media/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${gpToken}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('File deleted successfully.');
        loadMedia();
      }
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5 text-sky-400" />;
    return <FileText className="w-5 h-5 text-yellow-500" />;
  };

  // Filter list
  const filteredItems = items.filter(item => {
    // Search filter
    if (searchQuery && !item.filename.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    // Folder filter
    if (activeFolder === 'images' && !item.type.startsWith('image/')) return false;
    if (activeFolder === 'videos' && !item.type.startsWith('video/')) return false;
    if (activeFolder === 'docs' && item.type.startsWith('image/') || item.type.startsWith('video/')) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <div className="fixed top-5 right-5 z-50 space-y-2">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`p-4 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold backdrop-blur-md border ${
              t.type === 'error' 
                ? 'bg-rose-950/80 border-rose-500/30 text-rose-300' 
                : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {t.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-400" />
            Media Library
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store and search images, product demonstrations, PDFs, and marketing slide decks.
          </p>
        </div>
        <button 
          onClick={() => handleUpload()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-500 rounded-xl border border-emerald-500/20 shadow-md shadow-emerald-500/10 transition-all active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Asset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Folders tree (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 ">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2 px-2">Folders</span>
            
            <button
              onClick={() => setActiveFolder('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeFolder === 'all' 
                  ? 'bg-slate-50 text-white border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                {activeFolder === 'all' ? <FolderOpen className="w-4 h-4 text-emerald-400" /> : <Folder className="w-4 h-4 text-slate-500" />}
                <span>All Assets</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{items.length}</span>
            </button>

            <button
              onClick={() => setActiveFolder('images')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeFolder === 'images' 
                  ? 'bg-slate-50 text-white border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                {activeFolder === 'images' ? <FolderOpen className="w-4 h-4 text-emerald-400" /> : <Folder className="w-4 h-4 text-slate-500" />}
                <span>Images & Banners</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{items.filter(x => x.type.startsWith('image/')).length}</span>
            </button>

            <button
              onClick={() => setActiveFolder('videos')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeFolder === 'videos' 
                  ? 'bg-slate-50 text-white border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                {activeFolder === 'videos' ? <FolderOpen className="w-4 h-4 text-emerald-400" /> : <Folder className="w-4 h-4 text-slate-500" />}
                <span>Videos</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{items.filter(x => x.type.startsWith('video/')).length}</span>
            </button>

            <button
              onClick={() => setActiveFolder('docs')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeFolder === 'docs' 
                  ? 'bg-slate-50 text-white border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                {activeFolder === 'docs' ? <FolderOpen className="w-4 h-4 text-emerald-400" /> : <Folder className="w-4 h-4 text-slate-500" />}
                <span>Documents (PDF)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{items.filter(x => !x.type.startsWith('image/') && !x.type.startsWith('video/')).length}</span>
            </button>
          </div>
        </div>

        {/* Right column: Grid list (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder="Search file library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Grid display */}
          {filteredItems.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/20">
              <ImageIcon className="w-10 h-10 text-slate-700 mx-auto mb-2 stroke-[1.5]" />
              <p className="text-xs text-slate-500">No media assets match your active folder/search filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col group"
                >
                  {/* Thumbnail */}
                  <div className="bg-slate-50 h-32 flex items-center justify-center relative overflow-hidden">
                    {item.type.startsWith('image/') ? (
                      <img src={item.url} alt={item.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : item.type.startsWith('video/') ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <Video className="w-8 h-8 text-sky-400" />
                        <span className="text-[8px] bg-slate-50 px-1 py-0.5 rounded text-slate-500 uppercase tracking-widest">Video Clip</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <FileText className="w-8 h-8 text-yellow-500" />
                        <span className="text-[8px] bg-slate-50 px-1 py-0.5 rounded text-slate-500 uppercase tracking-widest">PDF Document</span>
                      </div>
                    )}
                    
                    {/* Action hover mask */}
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2.5 transition-opacity">
                      <button 
                        onClick={() => window.open(item.url, '_blank')}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-white hover:border-slate-700 transition-all"
                        title="View Asset"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id, item.filename)}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-rose-400 hover:text-rose-300 hover:border-rose-900/30 transition-all"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3 border-t border-slate-200/60 bg-slate-50/20 text-xs flex flex-col justify-between flex-1">
                    <p className="font-bold text-white truncate" title={item.filename}>{item.filename}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-2.5">
                      <span className="flex items-center gap-1">
                        {getFileIcon(item.type)}
                        {formatBytes(item.size)}
                      </span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
