import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Trash2, ExternalLink, RefreshCw, AlertCircle, 
  CheckCircle2, Globe, Linkedin, Facebook, Instagram, Share2 
} from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  status: string;
  link?: string;
  hashtags?: string;
  created_at: string;
  updated_at?: string;
  provider?: string;
  provider_post_url?: string;
}

export const PublishedManager: React.FC = () => {
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
      const res = await fetch('http://localhost:3000/api/social/posts', {
        headers: { 'Authorization': `Bearer ${gpToken}` }
      });
      const data = await res.json();
      if (data.success) {
        // filter for published posts
        const published = (data.data || []).filter((p: any) => p.status === 'Published');
        setPosts(published);
      }
    } catch {
      showToast('Failed to load published posts history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this published post record? Note: This deletes the record from the GigPilot database.')) return;
    try {
      const gpToken = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch(`http://localhost:3000/api/social/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${gpToken}` }
      });
      const result = await res.json();
      if (result.success) {
        showToast('Successfully deleted published post record.');
        loadPosts();
      }
    } catch {
      showToast('Delete action failed', 'error');
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

  // Mock post link generator
  const getPostLink = (post: Post) => {
    if (post.provider_post_url) return post.provider_post_url;
    const provider = post.provider || 'linkedin';
    const mockId = Math.floor(100000000 + Math.random() * 900000000);
    switch (provider.toLowerCase()) {
      case 'linkedin': return `https://www.linkedin.com/feed/update/urn:li:share:${mockId}`;
      case 'facebook': return `https://facebook.com/page/posts/fb_post_${mockId}`;
      case 'instagram': return `https://instagram.com/p/ig_post_${mockId}`;
      case 'bluesky': return `https://bsky.app/profile/user.bsky.social/post/bsky_p_${mockId}`;
      case 'mastodon': return `https://mastodon.social/@user/${mockId}`;
      default: return `https://dev.to/user/post-${mockId}`;
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
            {t.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            Published History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse posts that have been successfully published to your linked channels.
          </p>
        </div>
        <button 
          onClick={loadPosts}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync History
        </button>
      </div>

      {/* List content */}
      {loading ? (
        <div className="text-center py-20 text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600" />
          Loading publication history...
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-slate-950/20 border border-dashed border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <CheckCircle className="w-12 h-12 text-slate-700 mx-auto mb-3 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-slate-350">No Published Posts</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto">
            You haven't successfully published any posts yet. Start scheduling or posting immediately.
          </p>
          <a
            href="/social/create"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl border border-emerald-500/20"
          >
            Publish a Post
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {posts.map((post) => (
            <div 
              key={post.id} 
              className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row gap-5 items-start justify-between hover:border-slate-750 transition-all"
            >
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold uppercase flex items-center gap-1">
                    {getPlatformIcon(post.provider)}
                    {post.provider || 'LinkedIn'}
                  </span>
                  
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Published on: {new Date(post.updated_at || post.created_at).toLocaleString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug truncate">{post.title || 'Untitled Post'}</h3>
                <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed max-w-3xl">{post.content}</p>
                
                {post.link && (
                  <p className="text-[10px] text-sky-400 underline font-mono truncate">{post.link}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-900/60 pt-3.5 md:pt-0">
                <a
                  href={getPostLink(post)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:border-slate-750 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Live Post
                </a>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-950/20 hover:bg-rose-950/60 border border-rose-900/30 text-rose-400 hover:text-rose-350 font-bold text-xs rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Log
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
