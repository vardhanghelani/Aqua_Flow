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
        <Route path="/dashboard" element={<ProtectedRoute role="business"><DashboardPage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute role="business"><CustomersPage /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute role="business"><CustomerDetailPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute role="business"><PaymentsPage /></ProtectedRoute>} />
        <Route path="/settlements" element={<ProtectedRoute role="business"><SettlementsPage /></ProtectedRoute>} />
        <Route path="/collections" element={<ProtectedRoute role="business"><CollectionsPage /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute role="business"><ExpensesPage /></ProtectedRoute>} />
        <Route path="/drivers/:id/performance" element={<ProtectedRoute role="business"><DriverPerformancePage /></ProtectedRoute>} />
        <Route path="/areas" element={<ProtectedRoute role="business"><AreasPage /></ProtectedRoute>} />
        <Route path="/drivers" element={<ProtectedRoute role="business"><DriversPage /></ProtectedRoute>} />
        <Route path="/assignments" element={<ProtectedRoute role="business"><AssignmentsPage /></ProtectedRoute>} />
        <Route path="/deliveries" element={<ProtectedRoute role="business"><OwnerDeliveriesPage /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute role="business"><InventoryPage /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute role="business"><InvoicesPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute role="business"><ReportsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute role="business"><SettingsPage /></ProtectedRoute>} />
        {/* Legacy redirects */}
        <Route path="/pricing" element={<Navigate to="/settings" replace />} />
        <Route path="/audit" element={<Navigate to="/settings" replace />} />
        <Route path="/driver/deliveries" element={<ProtectedRoute role="driver"><DeliveriesPage /></ProtectedRoute>} />
        <Route path="/driver/history" element={<ProtectedRoute role="driver"><HistoryPage /></ProtectedRoute>} />
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
