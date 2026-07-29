import React, { useState, useEffect } from 'react';
import { 
  Calendar, KanbanSquare, Clock, Filter, Eye, Edit2, 
  Trash2, RefreshCw, ChevronLeft, ChevronRight, PlusCircle, CheckCircle, 
  Linkedin, Facebook, Instagram, Globe, Plus
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
  campaign_id?: string;
  mediaUrls?: string[];
}

interface Campaign {
  id: string;
  name: string;
  color: string;
}

interface SocialAccount {
  id: string;
  provider: string;
  display_name: string;
}

export const CalendarManager: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'kanban'>('month');
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Calendar coordinate
  const [currentDate, setCurrentDate] = useState(new Date());

  // Edit / Detail Modal state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editTime, setEditTime] = useState('');
  const [toasts, setToasts] = useState<{ id: string; message: string; type?: 'success' | 'error' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      
      // Load posts
      const postsRes = await fetch('http://localhost:3000/api/social/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const postsData = await postsRes.json();
      
      // Load scheduled items to bind providers if any
      const schedRes = await fetch('http://localhost:3000/api/social/accounts', { // load accounts for filtering
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const accData = await schedRes.json();
      if (accData.success) {
        setAccounts(accData.data || []);
      }

      const campRes = await fetch('http://localhost:3000/api/social/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const campData = await campRes.json();
      if (campData.success) {
        setCampaigns(campData.data || []);
      }

      if (postsData.success) {
        // Mock link scheduled times to calendar if missing
        const loadedPosts = (postsData.data || []).map((p: any) => {
          if (p.status === 'Scheduled' && !p.scheduled_time) {
            // Mock scheduled time tomorrow if blank
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);
            return {
              ...p,
              scheduled_time: tomorrow.toISOString(),
              provider: p.provider || 'linkedin'
            };
          }
          return p;
        });
        setPosts(loadedPosts);
      }
    } catch {
      showToast('Failed to retrieve content schedule from API', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;

    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const updates: any = {
        id: selectedPost.id,
        title: editTitle,
        content: editContent,
        status: editStatus,
      };

      if (editStatus === 'Scheduled' && editTime) {
        updates.scheduled_time = new Date(editTime).toISOString();
      }

      const res = await fetch('http://localhost:3000/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const result = await res.json();
      if (result.success) {
        showToast('Successfully updated post!');
        setSelectedPost(null);
        loadData();
      }
    } catch {
      showToast('Failed to update post', 'error');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post? This will cancel any pending schedules.')) return;
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch(`http://localhost:3000/api/social/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Post deleted successfully');
        setSelectedPost(null);
        loadData();
      }
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const handleOpenDetail = (post: Post) => {
    setSelectedPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditStatus(post.status);
    if (post.scheduled_time) {
      const date = new Date(post.scheduled_time);
      // Format to datetime-local string
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset*60*1000));
      setEditTime(localDate.toISOString().slice(0, 16));
    } else {
      setEditTime('');
    }
  };

  // Get filtered posts
  const getFilteredPosts = () => {
    return posts.filter(p => {
      // Platform filter
      if (filterPlatform && p.provider && p.provider.toLowerCase() !== filterPlatform.toLowerCase()) return false;
      // Campaign filter
      if (filterCampaign && p.campaign_id !== filterCampaign) return false;
      // Status filter
      if (filterStatus && p.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
      return true;
    });
  };

  // Move month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Month days generator
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Pad previous month days
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Current month days
    for (let i = 1; i <= daysCount; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getPlatformColor = (provider?: string) => {
    switch (provider?.toLowerCase()) {
      case 'linkedin': return 'bg-[#0077B5]/20 text-[#0077B5] border-[#0077B5]/30';
      case 'facebook': return 'bg-[#1877F2]/20 text-[#1877F2] border-[#1877F2]/30';
      case 'instagram': return 'bg-[#E1306C]/20 text-[#E1306C] border-[#E1306C]/30';
      default: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  const getPlatformIcon = (provider?: string) => {
    switch (provider?.toLowerCase()) {
      case 'linkedin': return <Linkedin className="w-3 h-3 flex-shrink-0" />;
      case 'facebook': return <Facebook className="w-3 h-3 flex-shrink-0" />;
      case 'instagram': return <Instagram className="w-3 h-3 flex-shrink-0" />;
      default: return <Globe className="w-3 h-3 flex-shrink-0" />;
    }
  };

  const filteredPosts = getFilteredPosts();

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
            {t.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Content Calendar
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Drag, drop, and coordinate your multi-channel posts in Monthly, Weekly or Kanban board views.
          </p>
        </div>
        
        {/* Toggle view controls */}
        <div className="flex bg-slate-900 border border-slate-850 p-1.5 rounded-xl text-xs gap-1 font-semibold text-slate-400">
          <button 
            onClick={() => setViewMode('month')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${viewMode === 'month' ? 'bg-slate-950 text-white' : 'hover:text-slate-200'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setViewMode('kanban')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'kanban' ? 'bg-slate-950 text-white' : 'hover:text-slate-200'}`}
          >
            <KanbanSquare className="w-3.5 h-3.5" />
            Kanban
          </button>
        </div>
      </div>

      {/* Filters block */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-950/30 border border-slate-800/60 p-4 rounded-2xl backdrop-blur-xl">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          Filter Schedule:
        </span>

        {/* Platform selection */}
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="bg-slate-900 border border-slate-850 rounded-xl p-2 text-xs text-white focus:outline-none"
        >
          <option value="">All Social Networks</option>
          <option value="linkedin">LinkedIn</option>
          <option value="facebook">Facebook Pages</option>
          <option value="instagram">Instagram Business</option>
          <option value="bluesky">Bluesky</option>
          <option value="mastodon">Mastodon</option>
          <option value="dev.to">Dev.to</option>
        </select>

        {/* Campaign Selection */}
        <select
          value={filterCampaign}
          onChange={(e) => setFilterCampaign(e.target.value)}
          className="bg-slate-900 border border-slate-850 rounded-xl p-2 text-xs text-white focus:outline-none"
        >
          <option value="">All Campaigns</option>
          {campaigns.map(camp => (
            <option key={camp.id} value={camp.id}>{camp.name}</option>
          ))}
        </select>

        {/* Status selection */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-slate-850 rounded-xl p-2 text-xs text-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="draft">Drafts</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="failed">Failed</option>
        </select>

        <a 
          href="/social/create"
          className="ml-auto flex items-center gap-1 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl border border-emerald-500/20 shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          Schedule Post
        </a>
      </div>

      {/* Month Calendar layout */}
      {viewMode === 'month' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-xl">
          {/* Calendar Month Header */}
          <div className="p-5 border-b border-slate-850 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={prevMonth}
                className="p-2 bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-white rounded-xl transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-white rounded-xl transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days labels */}
          <div className="grid grid-cols-7 border-b border-slate-850/60 bg-slate-900/35 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest py-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 grid-flow-row min-h-[450px] bg-slate-950/20">
            {getDaysInMonth().map((day, idx) => {
              if (!day) return <div key={`pad-${idx}`} className="border-r border-b border-slate-850/50 bg-slate-950/5" />;
              
              const dayStr = day.toISOString().split('T')[0];
              const dayPosts = filteredPosts.filter(p => {
                const pDate = p.scheduled_time ? p.scheduled_time.split('T')[0] : p.created_at.split('T')[0];
                return pDate === dayStr;
              });

              return (
                <div 
                  key={dayStr} 
                  className="border-r border-b border-slate-850/50 p-3 min-h-[90px] flex flex-col justify-between hover:bg-slate-900/10 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-500 mb-1">{day.getDate()}</span>
                  
                  <div className="space-y-1.5 flex-1">
                    {dayPosts.slice(0, 3).map(post => (
                      <button
                        key={post.id}
                        onClick={() => handleOpenDetail(post)}
                        className={`w-full text-left p-1.5 border rounded-lg text-[9px] font-semibold truncate flex items-center gap-1 ${getPlatformColor(post.provider || 'linkedin')}`}
                      >
                        {getPlatformIcon(post.provider || 'linkedin')}
                        <span className="truncate">{post.title || post.content}</span>
                      </button>
                    ))}
                    {dayPosts.length > 3 && (
                      <div className="text-[8px] text-slate-500 font-bold text-center">
                        + {dayPosts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Columns: Draft, Scheduled, Published, Failed */}
          {['Draft', 'Scheduled', 'Published', 'Failed'].map(status => {
            const colPosts = filteredPosts.filter(p => p.status.toLowerCase() === status.toLowerCase());
            
            return (
              <div key={status} className="bg-slate-950/40 border border-slate-800/80 rounded-3xl p-5 backdrop-blur-xl flex flex-col max-h-[500px]">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <span className={`w-2 h-2 rounded-full ${
                      status === 'Published' ? 'bg-emerald-500' :
                      status === 'Scheduled' ? 'bg-indigo-500' :
                      status === 'Failed' ? 'bg-rose-500' : 'bg-slate-500'
                    }`} />
                    {status}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono font-bold">
                    {colPosts.length}
                  </span>
                </div>

                <div className="space-y-4 overflow-y-auto flex-1 pr-1.5 scrollbar-thin">
                  {colPosts.map(post => (
                    <div 
                      key={post.id}
                      onClick={() => handleOpenDetail(post)}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-850/80 hover:border-slate-700/80 transition-all cursor-pointer space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 ${getPlatformColor(post.provider || 'linkedin')}`}>
                          {getPlatformIcon(post.provider || 'linkedin')}
                          {post.provider || 'Channel'}
                        </span>
                        {post.scheduled_time && (
                          <span className="text-[8px] font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(post.scheduled_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-white truncate">{post.title || 'Untitled Post'}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{post.content}</p>
                    </div>
                  ))}
                  {colPosts.length === 0 && (
                    <div className="py-12 text-center text-[10px] text-slate-550 border border-dashed border-slate-850 rounded-2xl">
                      No posts in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Detail Modal overlay */}
      {selectedPost && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D121F] border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-850">
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 ${getPlatformColor(selectedPost.provider || 'linkedin')}`}>
                  {getPlatformIcon(selectedPost.provider || 'linkedin')}
                  {selectedPost.provider || 'Social Post'}
                </span>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="text-xs text-slate-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <h3 className="text-sm font-bold text-white mt-3">Post Detail Options</h3>
            </div>

            <form onSubmit={handleQuickEdit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase block">Title / Ref</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase block">Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase block">Workflow Stage</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Published">Published</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase block">Schedule Timestamp</label>
                  <input
                    type="datetime-local"
                    value={editTime}
                    disabled={editStatus !== 'Scheduled'}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-850 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => handleDeletePost(selectedPost.id)}
                  className="px-4 py-2.5 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded-xl border border-rose-900/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Delete Post
                </button>
                
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Save Quick Edit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
