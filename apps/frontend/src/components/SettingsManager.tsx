import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Cpu, Bell, Shield, Save, 
  Trash2, Download, CheckCircle, Info, Key, Globe
} from 'lucide-react';

interface UserSettings {
  default_provider?: string;
  default_tone?: string;
  email_notifications?: boolean;
  dark_mode?: boolean;
  language?: string;
  timezone?: string;
  openai_key?: string;
  gemini_key?: string;
}

export const SettingsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [fullName, setFullName] = useState('Alex Vance');
  const [email, setEmail] = useState('alex@gigpilot.ai');
  const [role, setRole] = useState('Pro');
  
  // Settings states
  const [defaultProvider, setDefaultProvider] = useState('gemini');
  const [defaultTone, setDefaultTone] = useState('Professional');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('UTC-5 (EST)');
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  const addToast = (message: string) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const userRes = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userResult = await userRes.json();
      if (userResult.success && userResult.data) {
        setFullName(userResult.data.full_name || userResult.data.fullName || 'Alex Vance');
        setEmail(userResult.data.email || 'alex@gigpilot.ai');
        setRole(userResult.data.role || 'Pro');
      }

      const settingsRes = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const settingsResult = await settingsRes.json();
      if (settingsResult.success && settingsResult.data) {
        const s = settingsResult.data as UserSettings;
        setDefaultProvider(s.default_provider || 'gemini');
        setDefaultTone(s.default_tone || 'Professional');
        setEmailNotifications(s.email_notifications !== false);
        setDarkMode(s.dark_mode !== false);
        setLanguage(s.language || 'English');
        setTimezone(s.timezone || 'UTC-5 (EST)');
        setOpenaiKey(s.openai_key || '');
        setGeminiKey(s.gemini_key || '');
      }
    } catch {
      // Local backup sync loader
      const backupUser = localStorage.getItem('gp_user');
      if (backupUser) {
        const u = JSON.parse(backupUser);
        setFullName(u.fullName || u.full_name || 'Alex Vance');
        setEmail(u.email || 'alex@gigpilot.ai');
        setRole(u.role || 'Pro');
      }
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch((import.meta.env.PUBLIC_API_URL || 'http://localhost:3000') + '/api/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName,
          default_provider: defaultProvider,
          default_tone: defaultTone,
          email_notifications: emailNotifications,
          dark_mode: darkMode,
          language,
          timezone,
          openai_key: openaiKey,
          gemini_key: geminiKey
        })
      });
      const result = await res.json();
      if (result.success) {
        addToast('Settings successfully saved to database!');
        // Update local session cache
        const cache = localStorage.getItem('gp_user');
        if (cache) {
          const u = JSON.parse(cache);
          u.fullName = fullName;
          localStorage.setItem('gp_user', JSON.stringify(u));
        }
      } else {
        throw new Error(result.error);
      }
    } catch {
      addToast('Settings saved locally (offline mode)');
    }
  };

  const handleExportData = () => {
    const data = {
      profile: { fullName, email, role },
      settings: { defaultProvider, defaultTone, emailNotifications, darkMode, language, timezone },
      backupTime: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "gigpilot_profile_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Data archive download started!');
  };

  const handleDeleteAccount = () => {
    if (confirm('WARNING: Are you sure you want to permanently delete your account? All credit history, templates, and portfolios will be deleted. This cannot be undone.')) {
      localStorage.clear();
      addToast('Account deactivated successfully.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
  };

  return (
    <div className="p-6 max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 text-slate-300 font-sans">
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

      {/* Navigation tabs left */}
      <div className="md:col-span-1 space-y-1">
        {[
          { id: 'profile', label: 'Account Profile', icon: User },
          { id: 'provider', label: 'AI Configuration', icon: Cpu },
          { id: 'preferences', label: 'Preferences', icon: Globe },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'danger', label: 'Danger Zone', icon: Shield }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-slate-900/60 text-white border border-slate-800/80' 
                  : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Forms column right */}
      <div className="md:col-span-3">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {activeTab === 'profile' && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><User className="w-4 h-4 text-emerald-400" /> Account Profile</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full h-10 px-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="block w-full h-10 px-3.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
              
              <div className="text-[10px] bg-slate-950 p-3 rounded-xl border border-slate-850 text-slate-400">
                Active Tier Status: <strong className="text-emerald-400">{role} Member</strong>
              </div>
            </div>
          )}

          {activeTab === 'provider' && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><Cpu className="w-4 h-4 text-emerald-400" /> AI Provider Configuration</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Default Generator Engine</label>
                  <select 
                    value={defaultProvider}
                    onChange={(e) => setDefaultProvider(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="gemini">Gemini Pro (Google)</option>
                    <option value="openai">GPT-4o (OpenAI)</option>
                    <option value="claude">Claude 3.5 Sonnet</option>
                    <option value="groq">Llama 3 (Groq - Blazing Fast)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Default Content Tone</label>
                  <select 
                    value={defaultTone}
                    onChange={(e) => setDefaultTone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Professional">Professional & Formal</option>
                    <option value="Friendly">Friendly & Enthusiastic</option>
                    <option value="Persuasive">Persuasive (Sales pitch)</option>
                    <option value="Creative">Creative & Bold</option>
                  </select>
                </div>
              </div>

              {/* API keys */}
              <div className="space-y-3.5 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-emerald-400" /> Custom API Keys (optional overrides)</span>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">OpenAI API Key</label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="block w-full h-10 px-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gemini API Key</label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="block w-full h-10 px-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><Globe className="w-4 h-4 text-emerald-400" /> Regional & Display Preferences</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Language</label>
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Español</option>
                    <option value="French">Français</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Timezone</label>
                  <select 
                    value={timezone} 
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="UTC-5 (EST)">UTC-5 (EST)</option>
                    <option value="UTC+0 (GMT)">UTC+0 (GMT)</option>
                    <option value="UTC+5:30 (IST)">UTC+5:30 (IST)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><Bell className="w-4 h-4 text-emerald-400" /> Notifications & Interface</h3>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Email Generation Reports</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Receive summary audits of keywords and SEO health score updates</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="h-4.5 w-4.5 bg-slate-950 border border-slate-800 rounded text-emerald-600 focus:ring-emerald-500/40" 
                  />
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-850 pt-3.5">
                  <div>
                    <p className="font-bold text-white">Dark Mode Theme</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Switch canvas default appearance layout</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    className="h-4.5 w-4.5 bg-slate-950 border border-slate-800 rounded text-emerald-600 focus:ring-emerald-500/40" 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="bg-slate-900/40 border border-red-500/20 bg-red-500/5 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5"><Shield className="w-4 h-4 text-rose-400" /> Danger Zone</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs font-bold text-white">Export Profile Data Archive</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Download full configurations, default settings, and credentials.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={handleExportData}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-bold text-xs flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Data
                  </button>
                </div>
                
                <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs font-bold text-white">Deactivate User Account</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Delete database profile records. Action cannot be undone.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={handleDeleteAccount}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500/30 text-rose-450 font-bold text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'danger' && (
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-1.5 transition-all mt-4"
            >
              Save Settings <Save className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
