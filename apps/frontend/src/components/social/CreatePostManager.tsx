import React, { useState, useEffect } from 'react';
import { 
  Plus, Sparkles, Send, Calendar, Clock, Smile, Hash, 
  Paperclip, Trash2, Eye, Copy, RefreshCw, AlertCircle, 
  CheckCircle2, Globe, Linkedin, Facebook, Instagram, Share2, 
  ChevronRight, Play, FileText, Bot, Compass, Check
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  color: string;
}

interface SocialAccount {
  id: string;
  provider: string;
  display_name: string;
  username: string;
  avatar?: string;
}

export const CreatePostManager: React.FC = () => {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  
  // Media uploads list (urls)
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  
  // Schedule state
  const [isSchedule, setIsSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [timezone, setTimezone] = useState('UTC');

  // AI Assistance states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [selectedPlatformStyle, setSelectedPlatformStyle] = useState('linkedin');

  // Preview state
  const [previewTab, setPreviewTab] = useState('linkedin');
  const [isPublishing, setIsPublishing] = useState(false);
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
      
      const accountsRes = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const accountsData = await accountsRes.json();
      if (accountsData.success) {
        setAccounts(accountsData.data || []);
        // Autoselect first account
        if (accountsData.data && accountsData.data.length > 0) {
          setSelectedAccounts([accountsData.data[0].id]);
        }
      }

      const campaignsRes = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const campaignsData = await campaignsRes.json();
      if (campaignsData.success) {
        setCampaigns(campaignsData.data || []);
      }
    } catch {
      showToast('Error syncing accounts or campaigns', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Default scheduled time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
    setScheduleTime('10:00');
  }, []);

  const handleAiAction = async (action: 'generate' | 'rewrite' | 'suggest', toneTarget?: string, changeLen?: string) => {
    if (action === 'generate' && !aiPrompt) {
      showToast('Please enter an AI prompt description topic', 'error');
      return;
    }
    if (action === 'rewrite' && !content) {
      showToast('Write a draft content in editor first, then click Rewrite', 'error');
      return;
    }

    setAiGenerating(true);
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          prompt: aiPrompt,
          content,
          platform: selectedPlatformStyle,
          tone: toneTarget || 'Professional',
          length: changeLen || 'Medium'
        })
      });

      const result = await res.json();
      if (result.success && result.data) {
        if (action === 'suggest') {
          const suggestions = result.data;
          const tags = suggestions.hashtags ? suggestions.hashtags.map((t: string) => `#${t}`).join(' ') : '';
          const emojis = suggestions.emojis || '';
          setContent(prev => `${prev}\n\n${emojis}\n\n${tags}`);
          showToast('Added hashtags and emojis to post editor!');
        } else {
          setContent(result.data.content || '');
          if (result.data.title) setTitle(result.data.title);
          if (result.data.cta && !link) setLink('https://gigpilot.ai');
          showToast(`AI successfully ${action}d post!`);
        }
      }
    } catch {
      showToast('AI command failed. Please retry.', 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) {
      showToast('Post content is empty!', 'error');
      return;
    }
    if (selectedAccounts.length === 0) {
      showToast('Select at least one connected channel to publish/schedule!', 'error');
      return;
    }

    setIsPublishing(true);
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      
      if (isSchedule) {
        const scheduledTime = `${scheduleDate}T${scheduleTime}:00`;
        const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: title || 'Untitled Post',
            content,
            url: link,
            mediaUrls,
            scheduledTime,
            timezone,
            accountIds: selectedAccounts
          })
        });

        const data = await res.json();
        if (data.success) {
          showToast('Post successfully scheduled on content calendar!');
          // reset
          setTitle('');
          setContent('');
          setLink('');
        }
      } else {
        const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: title || 'Untitled Post',
            content,
            url: link,
            mediaUrls,
            accountIds: selectedAccounts
          })
        });

        const data = await res.json();
        if (data.success) {
          const results = data.data || [];
          const successCount = results.filter((r: any) => r.success).length;
          showToast(`Successfully published post to ${successCount}/${results.length} channels!`);
          setTitle('');
          setContent('');
          setLink('');
        }
      }
    } catch {
      showToast('Network error during publishing', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const mockUploadMedia = () => {
    const urls = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80'
    ];
    const picked = urls[Math.floor(Math.random() * urls.length)];
    setMediaUrls(prev => [...prev, picked]);
    showToast('Mock uploaded 1 image asset to media library.');
  };

  const handleToggleAccount = (id: string) => {
    setSelectedAccounts(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getPlatformIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
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
            {t.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-emerald-400" />
          Create Social Post
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Draft posts with advanced AI styling formatting, select channels, and post or schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left pane: Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handlePublish} className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-5">
            {/* Title / Reference */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Internal Title / Reference</label>
              <input
                type="text"
                placeholder="e.g. NextJS release promo post"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Target platforms */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Publish Channels</label>
              {accounts.length === 0 ? (
                <div className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 text-xs text-slate-500 flex justify-between items-center">
                  <span>No social accounts connected yet.</span>
                  <a href="/social/connect" className="text-emerald-400 font-bold hover:underline">Link accounts &rarr;</a>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {accounts.map(acc => {
                    const isSelected = selectedAccounts.includes(acc.id);
                    return (
                      <button
                        type="button"
                        key={acc.id}
                        onClick={() => handleToggleAccount(acc.id)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-gradient-to-tr from-emerald-950/50 to-emerald-900/20 border-emerald-500/50 text-white shadow-inner shadow-emerald-500/10'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-350'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-750 bg-slate-900'}`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        {getPlatformIcon(acc.provider)}
                        <span>{acc.display_name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Post Content */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Post Body content</label>
                <span className="text-[10px] text-slate-500 font-mono">{content.length} characters</span>
              </div>
              <textarea
                placeholder="What's on your mind? Draft your post here, or write a topic prompt below for the AI Assistant..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                required
              />
            </div>

            {/* Links, Campaign */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CTA External Link</label>
                <input
                  type="url"
                  placeholder="https://example.com/promo"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Marketing Campaign</label>
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">No Active Campaign</option>
                  {campaigns.map(camp => (
                    <option key={camp.id} value={camp.id}>{camp.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Media Upload Mock */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Post Media</label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={mockUploadMedia}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-slate-200 rounded-xl text-xs transition-all"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  Attach Media Asset
                </button>
                {mediaUrls.map((url, i) => (
                  <div key={i} className="relative group w-12 h-12 rounded-xl overflow-hidden border border-slate-800">
                    <img src={url} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setMediaUrls(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Publish Scheduler options */}
            <div className="border-t border-slate-900/60 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Schedule this post?</h4>
                  <p className="text-[10px] text-slate-400">Specify posting time calendar coordinates.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSchedule(!isSchedule)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors ${isSchedule ? 'bg-emerald-500' : 'bg-slate-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isSchedule ? 'translate-x-4' : ''}`} />
                </button>
              </div>

              {isSchedule && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-850">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Post Date</span>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Post Time</span>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Timezone</span>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                    >
                      <option value="UTC">UTC (GMT)</option>
                      <option value="EST">EST (UTC-5)</option>
                      <option value="PST">PST (UTC-8)</option>
                      <option value="IST">IST (UTC+5:30)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPublishing}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              {isPublishing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isSchedule ? (
                <>
                  <Calendar className="w-4 h-4" /> Schedule Post Calendar
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Publish Now
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right pane: AI and Live Preview Mockup (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Content Assistant */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-xl">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-slate-350">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              AI Assistant Writer
            </h3>
            
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Topic: e.g. tips to styling responsive templates..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <select
                  value={selectedPlatformStyle}
                  onChange={(e) => setSelectedPlatformStyle(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-white"
                >
                  <option value="linkedin">LinkedIn Style</option>
                  <option value="facebook">Facebook Style</option>
                  <option value="instagram">Instagram Style</option>
                  <option value="bluesky">Bluesky Style</option>
                  <option value="mastodon">Mastodon Style</option>
                </select>
                
                <button
                  type="button"
                  onClick={() => handleAiAction('generate')}
                  disabled={aiGenerating}
                  className="bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  {aiGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <>Generate Post</>}
                </button>
              </div>
            </div>

            {/* Prompt presets */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900/60 text-[10px] font-semibold text-slate-300">
              <button
                type="button"
                onClick={() => handleAiAction('rewrite')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-lg flex items-center gap-1 transition-all"
              >
                Rewrite
              </button>
              <button
                type="button"
                onClick={() => handleAiAction('rewrite', 'Professional', 'Short')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-lg flex items-center gap-1 transition-all"
              >
                Shorten
              </button>
              <button
                type="button"
                onClick={() => handleAiAction('rewrite', 'Professional', 'Long')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-lg flex items-center gap-1 transition-all"
              >
                Expand
              </button>
              <button
                type="button"
                onClick={() => handleAiAction('suggest')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-lg flex items-center gap-1 transition-all"
              >
                Suggest tags & Emojis
              </button>
            </div>
          </div>

          {/* Social feed preview mockups */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col h-[400px]">
            {/* Live mockup tabs header */}
            <div className="bg-slate-900/40 border-b border-slate-850 px-4 py-2.5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                Channel Preview
              </span>
              <div className="flex gap-1.5">
                {['linkedin', 'facebook', 'instagram', 'bluesky'].map(plat => (
                  <button
                    type="button"
                    key={plat}
                    onClick={() => setPreviewTab(plat)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      previewTab === plat
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {plat === 'linkedin' && <Linkedin className="w-3.5 h-3.5" />}
                    {plat === 'facebook' && <Facebook className="w-3.5 h-3.5" />}
                    {plat === 'instagram' && <Instagram className="w-3.5 h-3.5" />}
                    {plat === 'bluesky' && <Globe className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Card viewport */}
            <div className="p-5 flex-1 overflow-y-auto bg-[#070A11] flex items-center justify-center">
              {previewTab === 'linkedin' && (
                <div className="w-full bg-[#181F29] border border-[#2D3748] rounded-xl p-4 text-xs space-y-3 shadow-xl max-w-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-[11px]">AV</div>
                    <div>
                      <p className="font-bold text-slate-100 flex items-center gap-1">Alex Vance <span className="text-[9px] text-slate-500 font-normal">&bull; 1st</span></p>
                      <p className="text-[9px] text-slate-400">Freelance Web Specialist | GigPilot AI</p>
                    </div>
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap font-sans leading-relaxed break-words">{content || 'What is on your mind? Post draft details will show up here.'}</p>
                  {link && (
                    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/60">
                      <div className="p-2.5 border-t border-slate-700/60 space-y-0.5">
                        <span className="text-[8px] text-slate-400 uppercase">GIGPILOT.AI</span>
                        <p className="font-semibold text-slate-200 truncate">{link}</p>
                      </div>
                    </div>
                  )}
                  {mediaUrls.length > 0 && (
                    <img src={mediaUrls[0]} className="w-full h-40 object-cover rounded-lg border border-slate-800" />
                  )}
                </div>
              )}

              {previewTab === 'facebook' && (
                <div className="w-full bg-[#242526] border border-[#3E4042] rounded-xl p-4 text-xs space-y-3 shadow-xl max-w-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-[11px]">AV</div>
                    <div>
                      <p className="font-bold text-slate-100">Alex Vance Page</p>
                      <p className="text-[9px] text-slate-400">Just now &bull; Public</p>
                    </div>
                  </div>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{content || 'Post content text...'}</p>
                  {link && (
                    <div className="border border-[#3E4042] bg-[#3a3b3c] rounded overflow-hidden">
                      <div className="p-2 border-t border-[#3E4042]">
                        <p className="text-[9px] text-slate-400 uppercase">External Link</p>
                        <p className="font-semibold text-slate-100 truncate">{link}</p>
                      </div>
                    </div>
                  )}
                  {mediaUrls.length > 0 && (
                    <img src={mediaUrls[0]} className="w-full h-40 object-cover rounded-lg border border-slate-800" />
                  )}
                </div>
              )}

              {previewTab === 'instagram' && (
                <div className="w-full bg-[#000000] border border-slate-800 rounded-xl overflow-hidden shadow-xl max-w-sm">
                  <div className="p-3 flex items-center gap-2 border-b border-slate-900">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-[9px]">AV</div>
                    <span className="font-bold text-[11px] text-white">alexvance_ig</span>
                  </div>
                  <div className="bg-slate-900 h-44 flex items-center justify-center relative">
                    {mediaUrls.length > 0 ? (
                      <img src={mediaUrls[0]} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[10px] text-slate-500 font-mono text-center p-4">
                        [Instagram requires photos/videos]<br />Please attach a media asset to preview.
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-xs space-y-1">
                    <p className="text-white"><span className="font-bold mr-1.5">alexvance_ig</span>{content || 'Caption text...'}</p>
                    {link && <p className="text-sky-400 text-[10px] truncate">{link}</p>}
                  </div>
                </div>
              )}

              {previewTab === 'bluesky' && (
                <div className="w-full bg-[#161e2e] border border-slate-800 rounded-xl p-4 text-xs space-y-3 shadow-xl max-w-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-[11px]">AV</div>
                    <div>
                      <p className="font-bold text-slate-100">Alex Vance <span className="text-[9px] text-slate-500 font-normal">@alexv.bsky.social</span></p>
                    </div>
                  </div>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{content || 'Post content text...'}</p>
                  {link && (
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
                      <div className="p-2 border-t border-slate-800 text-[10px] space-y-0.5">
                        <span className="text-[8px] text-slate-400 uppercase">Bluesky Link facet</span>
                        <p className="font-semibold text-slate-300 truncate">{link}</p>
                      </div>
                    </div>
                  )}
                  {mediaUrls.length > 0 && (
                    <img src={mediaUrls[0]} className="w-full h-40 object-cover rounded-lg border border-slate-800" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
