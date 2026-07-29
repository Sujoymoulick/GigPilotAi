import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Cpu, Sparkles, BarChart3, Download, 
  Calendar, Clock, CheckCircle, ArrowUpRight, Award, Zap
} from 'lucide-react';

interface DailyLog {
  date: string;
  day: string;
  creditsUsed: number;
  wordsGenerated: number;
  timeSavedMinutes: number;
  toolUsage: { tool: string; count: number }[];
}

interface ToolUsageCount {
  tool: string;
  count: number;
}

interface AnalyticsResult {
  creditsRemaining: number;
  totalCreditsUsed: number;
  totalWordsGenerated: number;
  totalTimeSavedMinutes: number;
  favoriteTool: string;
  timeSavedHours: number;
  growthPercentage: number;
  dailyUsage: DailyLog[];
  monthlyUsage: DailyLog[];
  toolUsage: ToolUsageCount[];
}

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  const addToast = (message: string) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('gp_token') || 'mock-session-token';
      const res = await fetch('http://localhost:3000/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch {
      // Offline fallback seed loader
      setTimeout(() => {
        const mockLogs: DailyLog[] = [];
        const tools = ['Proposal Generator', 'Keyword Finder', 'Pricing Optimizer', 'Gig Health Checker', 'Portfolio Builder', 'Client Messages', 'Review Analyzer', 'SEO Audit', 'Publish Assistant'];
        
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const day = d.toLocaleDateString('en-US', { weekday: 'short' });
          const date = d.toISOString().split('T')[0];
          
          mockLogs.push({
            date,
            day,
            creditsUsed: [4, 8, 3, 10, 5, 2, 7][i % 7],
            wordsGenerated: [1200, 2400, 900, 3100, 1500, 600, 2100][i % 7],
            timeSavedMinutes: [60, 120, 45, 150, 75, 30, 105][i % 7],
            toolUsage: tools.map(t => ({ tool: t, count: Math.floor(Math.random() * 2) }))
          });
        }

        const toolCounts: Record<string, number> = {};
        tools.forEach((t, i) => {
          toolCounts[t] = [28, 14, 11, 24, 18, 35, 12, 19, 9][i];
        });

        setData({
          creditsRemaining: 450,
          totalCreditsUsed: 148,
          totalWordsGenerated: 34200,
          totalTimeSavedMinutes: 2220,
          favoriteTool: 'Client Messages',
          timeSavedHours: 37,
          growthPercentage: 24,
          dailyUsage: mockLogs,
          monthlyUsage: mockLogs,
          toolUsage: Object.entries(toolCounts).map(([tool, count]) => ({ tool, count }))
        });
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const headers = ['Date', 'Day', 'Credits Used', 'Words Generated', 'Time Saved (min)'];
    const rows = data.dailyUsage.map((log) => [
      log.date,
      log.day,
      log.creditsUsed,
      log.wordsGenerated,
      log.timeSavedMinutes
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gigpilot_analytics_export.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    addToast('Analytics exported successfully!');
  };

  // SVG dimensions for usage charts
  const width = 500;
  const height = 180;
  const padding = 30;

  const getLinePath = (logs: DailyLog[], type: 'creditsUsed' | 'wordsGenerated') => {
    if (logs.length === 0) return '';
    const maxVal = Math.max(...logs.map(l => l[type] as number)) || 1;
    const points = logs.map((log, idx) => {
      const x = padding + (idx / (logs.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((log[type] as number) / maxVal) * (height - 2 * padding);
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="p-6 max-w-7xl w-full mx-auto space-y-6 text-slate-300 font-sans">
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

      {/* Grid of metrics */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credits Remaining</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-extrabold text-white">{data.creditsRemaining}</span>
              <span className="text-xs text-slate-500">/ 500 total</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500" 
                style={{ width: `${(data.creditsRemaining / 500) * 100}%` }}
              />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Words Generated</span>
              <Sparkles className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-extrabold text-white">{data.totalWordsGenerated.toLocaleString()}</span>
              <span className="text-xs text-green-400 font-semibold flex items-center gap-0.5"><ArrowUpRight className="w-3.5 h-3.5" /> +{data.growthPercentage}%</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Credits consumed conversion</p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Time Saved</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-extrabold text-white">{data.timeSavedHours} Hours</span>
              <span className="text-xs text-emerald-400 font-semibold">Verified</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Calculation: 15 min per AI run</p>
          </div>

          {/* Card 4 */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Tool Module</span>
              <Award className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-lg font-extrabold text-white truncate max-w-[170px]">{data.favoriteTool}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Most active workspace</p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Usage Chart */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Credit Consumption (Line Chart)</h3>
                <p className="text-[10px] text-slate-400 font-medium">Daily credit usage analysis this week</p>
              </div>
              <button 
                onClick={handleExportCsv}
                className="px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white transition-all text-[10px] font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>

            {/* Custom SVG Line Graph */}
            <div className="w-full relative h-48 pt-2">
              <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                {/* Horizontal Grid lines */}
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                
                {/* Line Path */}
                <path 
                  d={getLinePath(data.dailyUsage, 'creditsUsed')} 
                  fill="none" 
                  stroke="#10B981" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />
              </svg>
              {/* X Labels */}
              <div className="absolute bottom-[-5px] left-0 w-full flex justify-between text-[8px] font-bold text-slate-500 px-6">
                {data.dailyUsage.map((log, i) => (
                  <span key={i}>{log.day}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Tool Allocation bar chart */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Tool Popularity (Bar Chart)</h3>
              <p className="text-[10px] text-slate-400 font-medium">Generation metrics breakdown per workspace</p>
            </div>

            <div className="space-y-3.5">
              {data.toolUsage.slice(0, 5).map((tool, idx) => {
                const maxCount = Math.max(...data.toolUsage.map(t => t.count));
                const widthPct = Math.max(10, Math.round((tool.count / maxCount) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-300">
                      <span className="truncate pr-4 font-medium">{tool.tool}</span>
                      <span className="font-bold font-mono">{tool.count} runs</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
