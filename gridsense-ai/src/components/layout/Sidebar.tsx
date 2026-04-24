import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, AlertTriangle, Map, SlidersHorizontal } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/forecasting', label: 'Forecasting', icon: TrendingUp },
  { path: '/anomalies', label: 'Anomalies', icon: AlertTriangle },
  { path: '/zones/BLR-N01', label: 'Zone Detail', icon: Map },
  { path: '/settings', label: 'Settings', icon: SlidersHorizontal },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-grid-panel border-r border-border-subtle flex flex-col shrink-0 hidden md:flex relative z-10">
      <div className="p-4 flex-1 mt-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-sans transition-all duration-150 ${
                  isActive 
                    ? 'text-cyan-electric bg-cyan-electric/5 border-l-2 border-cyan-electric' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-grid-slate border-l-2 border-transparent'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};
