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

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'owner' | 'driver' }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'driver' ? '/driver/deliveries' : '/dashboard'} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'driver' ? '/driver/deliveries' : '/dashboard'} /> : <LoginPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<ProtectedRoute role="owner"><DashboardPage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute role="owner"><CustomersPage /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute role="owner"><CustomerDetailPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute role="owner"><PaymentsPage /></ProtectedRoute>} />
        <Route path="/settlements" element={<ProtectedRoute role="owner"><SettlementsPage /></ProtectedRoute>} />
        <Route path="/collections" element={<ProtectedRoute role="owner"><CollectionsPage /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute role="owner"><ExpensesPage /></ProtectedRoute>} />
        <Route path="/drivers/:id/performance" element={<ProtectedRoute role="owner"><DriverPerformancePage /></ProtectedRoute>} />
        <Route path="/areas" element={<ProtectedRoute role="owner"><AreasPage /></ProtectedRoute>} />
        <Route path="/drivers" element={<ProtectedRoute role="owner"><DriversPage /></ProtectedRoute>} />
        <Route path="/assignments" element={<ProtectedRoute role="owner"><AssignmentsPage /></ProtectedRoute>} />
        <Route path="/deliveries" element={<ProtectedRoute role="owner"><OwnerDeliveriesPage /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute role="owner"><InventoryPage /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute role="owner"><InvoicesPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute role="owner"><ReportsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute role="owner"><SettingsPage /></ProtectedRoute>} />
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
