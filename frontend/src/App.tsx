import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ToastProvider } from '@/hooks/useToast';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/owner/DashboardPage';
import { AreasPage } from '@/pages/owner/AreasPage';
import { DriversPage } from '@/pages/owner/DriversPage';
import { CustomersPage } from '@/pages/owner/CustomersPage';
import { AssignmentsPage } from '@/pages/owner/AssignmentsPage';
import { OwnerDeliveriesPage } from '@/pages/owner/OwnerDeliveriesPage';
import { InventoryPage } from '@/pages/owner/InventoryPage';
import { InvoicesPage } from '@/pages/owner/InvoicesPage';
import { ReportsPage } from '@/pages/owner/ReportsPage';
import { SettingsPage } from '@/pages/owner/SettingsPage';
import { PaymentsPage } from '@/pages/owner/PaymentsPage';
import { CustomerDetailPage } from '@/pages/owner/CustomerDetailPage';
import { SettlementsPage } from '@/pages/owner/SettlementsPage';
import { CollectionsPage } from '@/pages/owner/CollectionsPage';
import { ExpensesPage } from '@/pages/owner/ExpensesPage';
import { DriverPerformancePage } from '@/pages/owner/DriverPerformancePage';
import { DeliveriesPage } from '@/pages/driver/DeliveriesPage';
import { HistoryPage } from '@/pages/driver/HistoryPage';
import { ProvisionPage } from '@/pages/auth/ProvisionPage';
import { isBusinessUser, businessHomePath } from '@/lib/auth-utils';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'business' | 'driver' }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'business' && !isBusinessUser(user.role)) {
    return <Navigate to="/driver/deliveries" replace />;
  }
  if (role === 'driver' && user.role !== 'driver') {
    return <Navigate to={businessHomePath(user)} replace />;
  }
  return <>{children}</>;
}

/** Role guard without re-showing the full-page loader on nested routes. */
function DriverOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'driver') return <Navigate to={businessHomePath(user)} replace />;
  return <>{children}</>;
}

function BusinessOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isBusinessUser(user.role)) return <Navigate to="/driver/deliveries" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={businessHomePath(user)} /> : <LoginPage />}
      />
      <Route path="/provision" element={<ProvisionPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<BusinessOnly><DashboardPage /></BusinessOnly>} />
        <Route path="/customers" element={<BusinessOnly><CustomersPage /></BusinessOnly>} />
        <Route path="/customers/:id" element={<BusinessOnly><CustomerDetailPage /></BusinessOnly>} />
        <Route path="/payments" element={<BusinessOnly><PaymentsPage /></BusinessOnly>} />
        <Route path="/settlements" element={<BusinessOnly><SettlementsPage /></BusinessOnly>} />
        <Route path="/collections" element={<BusinessOnly><CollectionsPage /></BusinessOnly>} />
        <Route path="/expenses" element={<BusinessOnly><ExpensesPage /></BusinessOnly>} />
        <Route path="/drivers/:id/performance" element={<BusinessOnly><DriverPerformancePage /></BusinessOnly>} />
        <Route path="/areas" element={<BusinessOnly><AreasPage /></BusinessOnly>} />
        <Route path="/drivers" element={<BusinessOnly><DriversPage /></BusinessOnly>} />
        <Route path="/assignments" element={<BusinessOnly><AssignmentsPage /></BusinessOnly>} />
        <Route path="/deliveries" element={<BusinessOnly><OwnerDeliveriesPage /></BusinessOnly>} />
        <Route path="/inventory" element={<BusinessOnly><InventoryPage /></BusinessOnly>} />
        <Route path="/invoices" element={<BusinessOnly><InvoicesPage /></BusinessOnly>} />
        <Route path="/reports" element={<BusinessOnly><ReportsPage /></BusinessOnly>} />
        <Route path="/settings" element={<BusinessOnly><SettingsPage /></BusinessOnly>} />
        {/* Legacy redirects */}
        <Route path="/pricing" element={<Navigate to="/settings" replace />} />
        <Route path="/audit" element={<Navigate to="/settings" replace />} />
        <Route path="/driver/deliveries" element={<DriverOnly><DeliveriesPage /></DriverOnly>} />
        <Route path="/driver/history" element={<DriverOnly><HistoryPage /></DriverOnly>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
