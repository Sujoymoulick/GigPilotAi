import React, { useState, useEffect } from 'react';
import { 
  Linkedin, Facebook, Instagram, Share2, Globe, RefreshCw, 
  CheckCircle2, AlertCircle, Trash2, ShieldAlert, Plus, HelpCircle, 
  ExternalLink, UserCheck, Calendar, Lock
} from 'lucide-react';

interface SocialAccount {
  id: string;
  provider: string;
  provider_user_id: string;
  username: string;
  display_name: string;
  email?: string;
  avatar?: string;
  expires_at?: string;
  status: string;
  last_sync: string;
  created_at: string;
}

export const ConnectManager: React.FC = () => {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  
  // Connect Dialog inputs
  const [code, setCode] = useState('');
  const [mastodonInstance, setMastodonInstance] = useState('mastodon.social');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toasts, setToasts] = useState<{ id: string; message: string; type?: 'success' | 'error' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        setAccounts(result.data);
      }
    } catch (e) {
      showToast('Failed to sync accounts from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectingProvider) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      let payloadCode = code.trim();
      
      // Specialize Mastodon format
      if (connectingProvider === 'mastodon') {
        payloadCode = `${mastodonInstance}|${code || 'mock'}`;
      }
      
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          provider: connectingProvider,
          code: payloadCode || 'mock',
          redirectUri: window.location.origin + '/social/callback'
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Successfully connected to ${connectingProvider}!`);
        setConnectingProvider(null);
        setCode('');
        fetchAccounts();
      } else {
        setErrorMsg(data.error || 'Failed to authenticate account');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async (accountId: string, providerName: string) => {
    if (!confirm(`Are you sure you want to disconnect your ${providerName} account?`)) return;

    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/social/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ accountId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Disconnected ${providerName} account.`);
        fetchAccounts();
      }
    } catch {
      showToast('Disconnection failed', 'error');
    }
  };

  const handleSync = async (provider: string) => {
    showToast(`Syncing ${provider} data...`);
    // Simulated sync, reload accounts
    setTimeout(() => {
      fetchAccounts();
      showToast(`Finished syncing ${provider}!`);
    }, 1000);
  };

  const providersList = [
    { name: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'from-[#0077B5]/20 to-[#0077B5]/5', border: 'border-[#0077B5]/30', brandColor: '#0077B5', description: 'Share updates, slide decks, and articles with your professional network.' },
    { name: 'facebook', label: 'Facebook Pages', icon: Facebook, color: 'from-[#1877F2]/20 to-[#1877F2]/5', border: 'border-[#1877F2]/30', brandColor: '#1877F2', description: 'Publish directly to your business page feed, reach clients, and track likes.' },
    { name: 'instagram', label: 'Instagram Business', icon: Instagram, color: 'from-[#E1306C]/20 to-[#E1306C]/5', border: 'border-[#E1306C]/30', brandColor: '#E1306C', description: 'Post portfolio images and videos automatically to your creator/business page.' },
    { name: 'bluesky', label: 'Bluesky', icon: Globe, color: 'from-[#0085FF]/20 to-[#0085FF]/5', border: 'border-[#0085FF]/30', brandColor: '#0085FF', description: 'Post updates directly using the decentralized AT Protocol.' },
    { name: 'mastodon', label: 'Mastodon', icon: Share2, color: 'from-[#6364FF]/20 to-[#6364FF]/5', border: 'border-[#6364FF]/30', brandColor: '#6364FF', description: 'Publish to any custom, federated open-source server node.' },
    { name: 'dev.to', label: 'Dev.to', icon: Globe, color: 'from-[#0A0A0A]/40 to-[#0A0A0A]/10', border: 'border-slate-700/80', brandColor: '#F4F4F5', description: 'Publish articles and coding advice directly to developer audiences.' }
  ];

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Social Integrations Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Securely link your channels via official OAuth and publish directly with platform API credentials.
          </p>
        </div>
        <button 
          onClick={fetchAccounts}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Status
        </button>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providersList.map((prov) => {
          const connectedAccs = accounts.filter(a => a.provider.toLowerCase() === prov.name.toLowerCase());
          const Icon = prov.icon;
          
          return (
            <div 
              key={prov.name} 
              className={`bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-700 flex flex-col justify-between`}
            >
              {/* Header block */}
              <div className={`bg-gradient-to-br ${prov.color} p-5 border-b border-slate-800/60 relative`}>
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-center">
                    <Icon className="w-6 h-6" style={{ color: prov.brandColor }} />
                  </div>
                  {connectedAccs.length > 0 ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Connected
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium border border-slate-700">
                      Disconnected
                    </span>
                  )}
                </div>
                
                <h3 className="text-sm font-bold text-white mt-4">{prov.label}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{prov.description}</p>
              </div>

              {/* Connected users block */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-slate-900/10">
                {connectedAccs.length > 0 ? (
                  <div className="space-y-4">
                    {connectedAccs.map((acc) => (
                      <div key={acc.id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 space-y-3">
                        <div className="flex items-center gap-3">
                          {acc.avatar ? (
                            <img src={acc.avatar} alt={acc.display_name} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs">
                              {acc.display_name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">{acc.display_name}</p>
                            <p className="text-[10px] text-slate-500 truncate">@{acc.username}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400 font-semibold border-t border-slate-900/60 pt-2.5">
                          <div>
                            <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-0.5">Connected</span>
                            <span className="text-slate-300 font-mono">{new Date(acc.created_at).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-0.5">Last Sync</span>
                            <span className="text-slate-300 font-mono">{new Date(acc.last_sync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="col-span-2 mt-1">
                            <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-0.5">Token Expiry</span>
                            <span className="text-slate-300 font-mono text-[9px] truncate flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5 text-slate-500" />
                              {acc.expires_at ? new Date(acc.expires_at).toLocaleDateString() : 'Permanent Token'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 border-t border-slate-900/60 pt-2.5">
                          <button 
                            onClick={() => handleSync(prov.label)}
                            className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:border-slate-700 transition-all"
                          >
                            Sync
                          </button>
                          <button 
                            onClick={() => setConnectingProvider(prov.name)}
                            className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:border-slate-700 transition-all"
                          >
                            Reconnect
                          </button>
                          <button 
                            onClick={() => handleDisconnect(acc.id, prov.label)}
                            className="p-1.5 bg-rose-950/20 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 border border-rose-900/30 rounded-lg transition-all"
                            title="Disconnect Channel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <HelpCircle className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
                    <p className="text-[11px] text-slate-500 max-w-[200px]">
                      No linked accounts for {prov.label}. Connect your channel to schedule and publish posts.
                    </p>
                  </div>
                )}

                {/* Connection button when disconnected */}
                {connectedAccs.length === 0 && (
                  <button 
                    onClick={() => {
                      setConnectingProvider(prov.name);
                      setCode('');
                    }}
                    className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/20 border border-emerald-500/20 transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> Link {prov.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect Modal Overlay */}
      {connectingProvider && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D121F] border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-850">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white capitalize">
                  Connect {connectingProvider} Account
                </h3>
                <button 
                  onClick={() => setConnectingProvider(null)}
                  className="text-xs text-slate-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Link via OAuth or official API credential keys.
              </p>
            </div>

            <form onSubmit={handleConnect} className="p-6 space-y-4">
              {connectingProvider === 'dev.to' ? (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Dev.to API Key</label>
                  <input
                    type="password"
                    placeholder="Enter DEV API Token (or type 'mock')"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Generate this in your Dev.to Account settings: Settings &gt; Extensions &gt; DEV Community API Keys.
                  </p>
                </div>
              ) : connectingProvider === 'mastodon' ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mastodon Instance Host</label>
                    <input
                      type="text"
                      placeholder="e.g. mastodon.social"
                      value={mastodonInstance}
                      onChange={(e) => setMastodonInstance(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">OAuth Code / Key</label>
                    <input
                      type="text"
                      placeholder="Enter verification code (or type 'mock')"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              ) : connectingProvider === 'bluesky' ? (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Bluesky Handle & App Password</label>
                  <input
                    type="text"
                    placeholder="e.g. username.bsky.social:app-pass-word"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Format: <strong>your-handle:your-app-password</strong>. Generate app passwords in Bluesky Settings &gt; App Passwords.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">OAuth 2.0 Integration Available</p>
                      <p className="mt-1 text-[11px] text-slate-400">Clicking connect will simulate redirecting to the official {connectingProvider} permission consent dialog.</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Verification Auth Code</label>
                    <input
                      type="text"
                      placeholder="Auth Code (or type 'mock' to connect instantly)"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-3 border-t border-slate-850 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setConnectingProvider(null)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-xl border border-slate-850 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="w-3.5 h-3.5" /> Confirm Link
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
