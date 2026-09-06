import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  LogOut, 
  User as UserIcon, 
  Bell, 
  Cpu, 
  Clock, 
  CloudRain, 
  ShieldAlert, 
  AlertTriangle, 
  Sparkles, 
  CheckCheck, 
  Trash2, 
  X, 
  ExternalLink,
  Navigation
} from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';

interface NotificationItem {
  id: string;
  title: string;
  category: 'CRITICAL' | 'WEATHER' | 'MODEL' | 'SITE';
  message: string;
  timestamp: string;
  isRead: boolean;
  link: string;
}

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  // Notification Popover state
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Critical Red-Zone Evacuation Advisory',
      category: 'CRITICAL',
      message: 'Raini Village Upper & Joshimath Sector 4 exceeded safe carrying capacity thresholds under current monsoon load.',
      timestamp: '10 mins ago',
      isRead: false,
      link: '/habitations'
    },
    {
      id: '2',
      title: '7-Day Heavy Rain Warning',
      category: 'WEATHER',
      message: 'Continuous heavy monsoon downpour (>55mm/day) predicted in Chamoli & Rudraprayag districts over next 48 hours.',
      timestamp: '35 mins ago',
      isRead: false,
      link: '/weather'
    },
    {
      id: '3',
      title: 'XAI Risk Engine Retrained',
      category: 'MODEL',
      message: 'XGBoost multi-hazard scoring model retrained with 96.4% Accuracy & SHAP feature importances updated.',
      timestamp: '1 hour ago',
      isRead: false,
      link: '/ml-studio'
    },
    {
      id: '4',
      title: 'Relocation Candidate Site Ready',
      category: 'SITE',
      message: 'Gauchar Plateau Safe Zone (Site Alpha) verified for 12,000 capacity with 90/100 water availability score.',
      timestamp: '2 hours ago',
      isRead: true,
      link: '/relocation'
    }
  ]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Click outside listener to close notification popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    setShowNotifications(false);
    navigate(notif.link);
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-950/80 text-purple-300 border-purple-800/80';
      case 'AUTHORITY': return 'bg-amber-950/80 text-amber-300 border-amber-800/80';
      case 'ANALYST': return 'bg-blue-950/80 text-blue-300 border-blue-800/80';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getNotificationCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'CRITICAL':
        return <span className="rounded bg-red-950 px-1.5 py-0.5 text-[9px] font-bold text-red-400 border border-red-800">Red Alert</span>;
      case 'WEATHER':
        return <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[9px] font-bold text-cyan-400 border border-cyan-800">Weather</span>;
      case 'MODEL':
        return <span className="rounded bg-purple-950 px-1.5 py-0.5 text-[9px] font-bold text-purple-300 border border-purple-800">AI / ML</span>;
      default:
        return <span className="rounded bg-blue-950 px-1.5 py-0.5 text-[9px] font-bold text-blue-400 border border-blue-800">Target Site</span>;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 shadow-lg shadow-blue-500/25 ring-1 ring-white/10">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-tight text-white">Disaster Risk DSS</h1>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
              v2.4 Enterprise
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Intelligent Red-Zone Identification & Relocation System</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time Ticking Clock & Date Chip */}
        <div className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300 shadow-inner">
          <Clock className="h-3.5 w-3.5 text-cyan-400 animate-pulse-subtle" />
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-200">{dateStr}</span>
            <span className="text-slate-600">|</span>
            <span className="font-mono font-bold text-cyan-400 text-xs">{timeStr}</span>
          </div>
        </div>

        {/* Quick Weather Telemetry Chip */}
        <Link
          to="/weather"
          title="Open Weather & Atmospheric Telemetry Studio (GPS Telemetry Active)"
          className="hidden md:flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-900/40 transition-all shadow-sm"
        >
          <Navigation className="h-3.5 w-3.5 text-cyan-400" />
          <CloudRain className="h-3.5 w-3.5 text-cyan-400 animate-bounce" />
          <span className="font-semibold text-[11px]">GPS Weather: Chamoli 21°C</span>
        </Link>


        {/* Live Engine Status Indicator */}
        <div className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-xs text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Cpu className="h-3.5 w-3.5" />
          <span className="font-semibold text-[11px]">AI Scoring Engine Online</span>
        </div>

        {/* Realistic High-Finish User Controls Widget */}
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-800/80 pl-3.5 relative" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              title="System Alerts & Notifications"
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all shadow-sm ${
                showNotifications
                  ? 'border-blue-500 bg-blue-950/80 text-blue-400 shadow-blue-500/20 ring-1 ring-blue-500/30'
                  : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-md animate-pulse-subtle">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {showNotifications && (
              <div className="absolute right-0 top-12 z-50 w-88 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900/95 p-4 backdrop-blur-2xl shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Disaster Risk System Alerts</h3>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.2 text-[9px] font-bold text-red-400">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        title="Mark all as read"
                        className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-blue-400 transition-colors"
                      >
                        <CheckCheck className="h-3 w-3" />
                        <span>Read All</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                      <Bell className="h-8 w-8 mx-auto text-slate-700 mb-2" />
                      <p className="font-semibold text-slate-400">No active notifications</p>
                      <p className="text-[11px] text-slate-600">All disaster risk alerts have been cleared.</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`group relative rounded-xl p-3 border transition-all cursor-pointer ${
                          !n.isRead
                            ? 'bg-slate-950/90 border-blue-900/60 hover:border-blue-700/80 shadow-md'
                            : 'bg-slate-950/40 border-slate-800/60 opacity-75 hover:opacity-100 hover:bg-slate-900/80'
                        }`}
                      >
                        {!n.isRead && (
                          <span className="absolute left-2 top-3.5 h-2 w-2 rounded-full bg-blue-500" />
                        )}
                        <div className="pl-3 space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-white text-[11px] group-hover:text-blue-300 transition-colors truncate">
                              {n.title}
                            </h4>
                            {getNotificationCategoryBadge(n.category)}
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">{n.message}</p>
                          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                            <span>{n.timestamp}</span>
                            <span className="flex items-center gap-1 font-semibold text-blue-400 group-hover:underline">
                              <span>Action</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Controls */}
                {notifications.length > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-800 pt-2.5 text-[10px]">
                    <button
                      onClick={clearAllNotifications}
                      className="flex items-center gap-1 text-slate-500 hover:text-red-400 transition-colors font-semibold"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Clear All Alerts</span>
                    </button>
                    <span className="text-slate-500 font-mono">Disaster Risk DSS v2.4</span>
                  </div>
                )}
              </div>
            )}

            {/* User Name & Role Pill */}
            <div className="hidden text-right md:block">
              <p className="text-xs font-bold text-slate-100">{user.full_name}</p>
              <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${getRoleBadgeColor(user.role_name)}`}>
                {user.role_name}
              </span>
            </div>

            {/* User Avatar Circle */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 border border-blue-400/40 text-white font-bold text-xs shadow-md ring-2 ring-blue-500/20">
              {user.full_name?.charAt(0) || <UserIcon className="h-4 w-4" />}
            </div>

            {/* Logout Action Button */}
            <button
              onClick={logout}
              title="Logout"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-red-900 hover:bg-red-950/40 hover:text-red-400 transition-all shadow-sm"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}


      </div>
    </header>
  );
};



