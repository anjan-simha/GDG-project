import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardPage } from './pages/DashboardPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { AnomalyPage } from './pages/AnomalyPage';
import { ZoneDetailPage } from './pages/ZoneDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { SkeletonLoader } from './components/shared/SkeletonLoader';
import { ToastContainer } from './components/shared/ToastContainer';

const queryClient = new QueryClient();

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay for app initialization
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
          <p className="text-sm font-mono text-cyan-electric animate-pulse">Connecting to GridSense API...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex flex-col h-screen overflow-hidden bg-grid-navy text-text-primary relative">
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
                <Route path="/audit" element={<AuditLogPage />} />
                <Route path="/intelligence" element={<IntelligencePage />} />
              </Routes>
            </main>
          </div>
          <ToastContainer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
