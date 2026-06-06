import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { MobileBottomNav } from './MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { isBusinessUser } from '@/lib/auth-utils';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isDriver = user?.role === 'driver';
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isBusinessUser(user?.role)) {
      api.getAlerts().then((a) => setAlertCount(a.length)).catch(() => {});
    }
  }, [user?.role, location.pathname]);

  return (
    <div className="flex min-h-screen bg-white">
      {!isDriver && (
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar
          onMenuClick={!isDriver ? () => setMobileOpen(true) : undefined}
          alertCount={alertCount}
          showSearch={!isDriver}
        />

        <main className={cn('flex-1 overflow-auto p-4 lg:p-6', isDriver && 'pb-20 lg:pb-6')}>
          <div className="erp-page">
            <Outlet />
          </div>
        </main>
      </div>

      {isDriver && <MobileBottomNav />}
    </div>
  );
}
