import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardPage } from './pages/DashboardPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { AnomalyPage } from './pages/AnomalyPage';
import { ZoneDetailPage } from './pages/ZoneDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { SkeletonLoader } from './components/shared/SkeletonLoader';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading synthetic data delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-grid-navy">
        <div className="flex flex-col items-center gap-4">
          <SkeletonLoader className="h-16 w-64" />
          <p className="text-sm font-mono text-cyan-electric animate-pulse">Initializing Synthetic Data...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen overflow-hidden bg-grid-navy text-text-primary">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col h-full relative overflow-y-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/forecasting" element={<ForecastingPage />} />
              <Route path="/anomalies" element={<AnomalyPage />} />
              <Route path="/zones/:zoneId" element={<ZoneDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
