import React, { useState, useEffect } from 'react';
import logoBlack from '../assets/logoblack.png';
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
  Link2,
  PlusCircle,
  Calendar,
  Clock,
  Image,
  Megaphone,
  LineChart,
  CheckSquare,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  currentPath?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath = '/dashboard' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) setIsOpen(false);
  }, [currentPath, isMobile]);

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

  const sidebarContent = (
    <aside
      className={`w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-40 text-slate-700 shadow-sm transition-transform duration-300 ${
        isMobile
          ? `fixed top-0 left-0 h-full z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
          : 'relative translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={logoBlack.src} alt="GigPilot Logo" className="w-8 h-8 object-contain" />
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
              GigPilot <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">AI</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">OS for Fiverr Freelancers</p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item, idx) => {
          if (item.type === 'section') {
            return (
              <div key={`sec-${idx}`} className="text-[10px] font-bold text-slate-500 tracking-wider px-3.5 pt-4 pb-1.5 uppercase first:pt-0">
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
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm'
                  : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-500 group-hover:text-emerald-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </div>

      {/* Plan Card Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5 rounded-xl border border-emerald-200 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-900">Pro Freelancer Plan</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 font-medium border border-teal-200">Active</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full w-[90%]" />
          </div>
          <p className="text-[11px] text-slate-600 mb-2">450 / 500 Credits remaining</p>
          <a
            href="/billing"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-sm shadow-emerald-500/20 transition-all"
          >
            Upgrade Plan <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-white border border-slate-200 shadow-md text-slate-700 hover:bg-slate-50 transition-all"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile overlay backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {sidebarContent}
    </>
  );
};
