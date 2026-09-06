import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  Home, 
  BrainCircuit, 
  MapPin, 
  UploadCloud, 
  Sliders, 
  AlertTriangle,
  CloudRain
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, badge: 'Live' },
    { to: '/gis-map', label: 'Interactive GIS Map', icon: Map, badge: 'GIS' },
    { to: '/weather', label: 'Weather & Atmosphere', icon: CloudRain, badge: '7-Day' },
    { to: '/habitations', label: 'Habitation Registry', icon: Home },
    { to: '/relocation', label: 'Relocation Sites', icon: MapPin, badge: 'Target' },
    { to: '/ml-studio', label: 'AI/ML & XAI Studio', icon: BrainCircuit, badge: 'SHAP' },
    { to: '/data-upload', label: 'Data Ingestion & CSV', icon: UploadCloud },
    { to: '/settings', label: 'Model Configuration', icon: Sliders },
  ];


  return (
    <aside className="flex w-64 flex-col border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-lg p-4">
      <div className="mb-3 px-3 py-2">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Navigation Modules</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-blue-400 border border-blue-500/30 shadow-md shadow-blue-500/10'
                    : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 hover:border hover:border-slate-800'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-400 group-hover:bg-blue-950 group-hover:text-blue-300 transition-colors">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-800/80 pt-4">
        <div className="rounded-xl bg-gradient-to-b from-amber-950/20 to-slate-950 p-3.5 border border-amber-800/30 shadow-inner">
          <div className="flex items-center gap-2 text-amber-400 mb-1.5">
            <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse-subtle" />
            <span className="text-[11px] font-bold tracking-tight">DSS Disclaimer</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Analytical decision-support outputs. Mandatory evacuations require formal disaster authority approval & field verification.
          </p>
        </div>
      </div>
    </aside>
  );
};

