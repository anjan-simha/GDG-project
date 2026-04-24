import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { format } from 'date-fns';

export const TopBar: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-grid-panel border-b border-border-subtle flex items-center justify-between px-6 shrink-0 relative z-20">
      <div className="flex items-center gap-2">
        <Activity className="text-cyan-electric" size={24} />
        <h1 className="text-xl font-bold font-mono tracking-tight text-text-primary">
          GridSense<span className="text-cyan-electric font-normal ml-1">AI</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-sm font-mono text-text-muted hidden sm:block">
          {format(time, 'HH:mm:ss')} · {format(time, 'dd MMM yyyy')}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-risk-low animate-pulse"></div>
          <span className="text-sm font-sans text-text-secondary uppercase">System Healthy</span>
        </div>
      </div>
    </header>
  );
};
