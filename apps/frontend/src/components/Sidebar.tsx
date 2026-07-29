import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Zap,
  FileText,
  Search,
  DollarSign,
  HeartPulse,
  Briefcase,
  MessageSquare,
  BarChart3,
  SearchCode,
  Send,
  Library,
  History,
  Bookmark,
  TrendingUp,
  CreditCard,
  Settings,
  ShieldCheck,
  ChevronRight,
  Bot,
  Globe,
  Link2,
  PlusCircle,
  Calendar,
  Clock,
  Image,
  Megaphone,
  LineChart,
  CheckSquare
} from 'lucide-react';

interface SidebarProps {
  currentPath?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath = '/dashboard' }) => {
  const navItems = [
    { type: 'section', label: 'Main Office' },
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'AI Workspace', icon: Sparkles, href: '/workspace' },
    
    { type: 'section', label: 'AI Freelance Tools' },
    { label: 'Gig Generator', icon: Zap, href: '/tools/gig-generator', badge: 'Popular' },
    { label: 'Proposal Generator', icon: FileText, href: '/tools/proposal-generator' },
    { label: 'Keyword Finder', icon: Search, href: '/tools/keyword-finder' },
    { label: 'Pricing Optimizer', icon: DollarSign, href: '/tools/pricing-optimizer' },
    { label: 'Gig Health Checker', icon: HeartPulse, href: '/tools/gig-health' },
    { label: 'Portfolio Builder', icon: Briefcase, href: '/tools/portfolio-builder' },
    { label: 'Client Messages', icon: MessageSquare, href: '/tools/client-reply' },
    { label: 'Review Analyzer', icon: BarChart3, href: '/tools/review-analyzer' },
    { label: 'SEO Audit', icon: SearchCode, href: '/tools/seo-audit' },
    { label: 'Publish Assistant', icon: Send, href: '/tools/publish-assistant' },
    
    { type: 'section', label: 'Social Hub' },
    { label: 'Connect Accounts', icon: Link2, href: '/social/connect' },
    { label: 'Create Post', icon: PlusCircle, href: '/social/create' },
    { label: 'Content Calendar', icon: Calendar, href: '/social/calendar' },
    { label: 'Scheduled Posts', icon: Clock, href: '/social/scheduled' },
    { label: 'Published Posts', icon: CheckSquare, href: '/social/published' },
    { label: 'Media Library', icon: Image, href: '/social/media' },
    { label: 'Campaigns', icon: Megaphone, href: '/social/campaigns' },
    { label: 'Social Analytics', icon: LineChart, href: '/social/analytics' },
    
    { type: 'section', label: 'System' },
    { label: 'Templates', icon: Library, href: '/templates' },
    { label: 'History', icon: History, href: '/history' },
    { label: 'Favorites', icon: Bookmark, href: '/favorites' },
    { label: 'Analytics', icon: TrendingUp, href: '/analytics' },
    { label: 'Billing', icon: CreditCard, href: '/billing' },
    { label: 'Settings', icon: Settings, href: '/settings' },
    { label: 'Admin Panel', icon: ShieldCheck, href: '/admin' },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-40 text-slate-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
            GigPilot <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">AI</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">OS for Fiverr Freelancers</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item, idx) => {
          if (item.type === 'section') {
            return (
              <div key={`sec-${idx}`} className="text-[10px] font-bold text-slate-500/80 tracking-wider px-3.5 pt-3 pb-1 uppercase border-t border-slate-900/30 first:border-t-0 first:pt-0">
                {item.label}
              </div>
            );
          }
          const Icon = item.icon!;
          const isActive = currentPath === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/10 text-white border border-emerald-500/30 shadow-inner'
                  : 'hover:bg-slate-900/80 hover:text-slate-100 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </div>

      {/* Plan Card Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 p-3.5 rounded-xl border border-emerald-500/20 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-white">Pro Freelancer Plan</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-medium">Active</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full w-[90%]" />
          </div>
          <p className="text-[11px] text-slate-400 mb-2">450 / 500 Credits remaining</p>
          <a
            href="/billing"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-md transition-all"
          >
            Upgrade Plan <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </aside>
  );
};
