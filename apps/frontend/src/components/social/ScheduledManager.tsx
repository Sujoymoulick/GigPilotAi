import React, { useState, useEffect } from 'react';
import { 
  Clock, Trash2, Send, Edit, RefreshCw, AlertCircle, 
  CheckCircle2, Calendar, ShieldAlert, Globe, Linkedin, Facebook, Instagram 
} from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  status: string;
  link?: string;
  hashtags?: string;
  created_at: string;
  scheduled_time?: string;
  provider?: string;
}

export const ScheduledManager: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<{ id: string; message: string; type?: 'success' | 'error' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const gpToken = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/posts', {
        headers: { 'Authorization': `Bearer ${gpToken}` }
      });
      const data = await res.json();
      if (data.success) {
        // filter for scheduled posts
        const scheduled = (data.data || []).filter((p: any) => p.status === 'Scheduled');
        setPosts(scheduled);
      }
    } catch {
      showToast('Failed to load scheduled queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handlePublishNow = async (id: string, post: Post) => {
    showToast('Publishing post immediately...');
    try {
      const gpToken = localStorage.getItem('gp_token') || 'mock-session-token';
      
      // Load accounts to find suitable one
      const accRes = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/accounts', {
        headers: { 'Authorization': `Bearer ${gpToken}` }
      });
      const accData = await accRes.json();
      if (!accData.success || !accData.data || accData.data.length === 0) {
        showToast('No connected accounts to publish to. Connect accounts first.', 'error');
        return;
      }

      // Filter matching provider
      const matches = accData.data.filter((a: any) => a.provider.toLowerCase() === (post.provider || 'linkedin').toLowerCase());
      const targetAccId = matches.length > 0 ? matches[0].id : accData.data[0].id;

      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gpToken}`
        },
        body: JSON.stringify({
          postId: id,
          accountIds: [targetAccId]
        })
      });

      const result = await res.json();
      if (result.success) {
        showToast('Successfully published post immediately!');
        loadPosts();
      }
    } catch {
      showToast('Publishing action failed', 'error');
    }
  };

  const handleCancelPost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled post?')) return;
    try {
      const gpToken = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch(`${import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_URL || 'http://localhost:3000'}/api/social/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${gpToken}` }
      });
      const result = await res.json();
      if (result.success) {
        showToast('Scheduled post cancelled and removed.');
        loadPosts();
      }
    } catch {
      showToast('Cancel failed', 'error');
    }
  };

  const getPlatformIcon = (provider?: string) => {
    switch (provider?.toLowerCase()) {
      case 'linkedin': return <Linkedin className="w-4 h-4 text-[#0077B5]" />;
      case 'facebook': return <Facebook className="w-4 h-4 text-[#1877F2]" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-[#E1306C]" />;
      default: return <Globe className="w-4 h-4 text-emerald-400" />;
    }
  };

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
            {t.type === 'error' ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Scheduled Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review and adjust scheduled social publications that are waiting to be posted.
          </p>
        </div>
        <button 
          onClick={loadPosts}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-white bg-white border border-slate-200 rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Queue
        </button>
      </div>

      {/* List content */}
      {loading ? (
        <div className="text-center py-20 text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600" />
          Loading scheduled queues...
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-slate-50/20 border border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <Clock className="w-12 h-12 text-slate-700 mx-auto mb-3 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-slate-350">Scheduled Queue is Empty</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto">
            You don't have any posts waiting to be published. Head over to the editor to schedule one.
          </p>
          <a
            href="/social/create"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl border border-emerald-500/20"
          >
            Create a Post
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {posts.map((post) => (
            <div 
              key={post.id} 
              className="bg-white border border-slate-200 rounded-2xl p-5  flex flex-col md:flex-row gap-5 items-start justify-between hover:border-slate-750 transition-all"
            >
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500 font-bold uppercase flex items-center gap-1">
                    {getPlatformIcon(post.provider)}
                    {post.provider || 'LinkedIn'}
                  </span>
                  
                  {post.scheduled_time && (
                    <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Scheduled for: {new Date(post.scheduled_time).toLocaleString()}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white leading-snug truncate">{post.title || 'Untitled Post'}</h3>
                <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed max-w-3xl">{post.content}</p>
                
                {post.link && (
                  <p className="text-[10px] text-sky-400 underline font-mono truncate">{post.link}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-200/60 pt-3.5 md:pt-0">
                <button
                  onClick={() => handlePublishNow(post.id, post)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-950/20 hover:bg-emerald-950/60 border border-emerald-900/30 text-emerald-400 hover:text-emerald-300 font-bold text-xs rounded-xl transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publish Now
                </button>
                <button
                  onClick={() => handleCancelPost(post.id)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-950/20 hover:bg-rose-950/60 border border-rose-900/30 text-rose-400 hover:text-rose-350 font-bold text-xs rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Cancel Post
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
