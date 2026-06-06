/** Local dev defaults to Vite proxy (/api). Production uses VITE_API_URL on Render/Vercel. */
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

class ApiClient {
  private token: string | null = localStorage.getItem('token');

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }

  getToken() {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data.data as T;
  }

  // Auth
  login(loginId: string, password: string) {
    return this.request<{ user: import('@/types').User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password }),
    });
  }

  me() {
    return this.request<import('@/types').User>('/auth/me');
  }

  // Areas
  getAreas() {
    return this.request<import('@/types').Area[]>('/areas');
  }
  createArea(data: Partial<import('@/types').Area>) {
    return this.request<import('@/types').Area>('/areas', { method: 'POST', body: JSON.stringify(data) });
  }
  updateArea(id: string, data: Partial<import('@/types').Area>) {
    return this.request<import('@/types').Area>(`/areas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  deleteArea(id: string) {
    return this.request<{ message: string }>(`/areas/${id}`, { method: 'DELETE' });
  }

  // Drivers
  getDrivers() {
    return this.request<import('@/types').Driver[]>('/drivers');
  }
  createDriver(data: Record<string, string>) {
    return this.request<import('@/types').Driver>('/drivers', { method: 'POST', body: JSON.stringify(data) });
  }
  updateDriver(id: string, data: Partial<import('@/types').Driver> & { loginId?: string; password?: string }) {
    return this.request<import('@/types').Driver>(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  deleteDriver(id: string) {
    return this.request<{ message: string }>(`/drivers/${id}`, { method: 'DELETE' });
  }

  // Customers
  getCustomers(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<import('@/types').Customer[]>(`/customers${qs}`);
  }
  createCustomer(data: Record<string, unknown>) {
    return this.request<import('@/types').Customer>('/customers', { method: 'POST', body: JSON.stringify(data) });
  }
  updateCustomer(id: string, data: Record<string, unknown>) {
    return this.request<import('@/types').Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  deleteCustomer(id: string) {
    return this.request<{ message: string }>(`/customers/${id}`, { method: 'DELETE' });
  }
  getCustomer(id: string) {
    return this.request<import('@/types').Customer>(`/customers/${id}`);
  }
  getCustomerAnalytics(id: string) {
    return this.request<import('@/types').CustomerAnalytics>(`/customers/${id}/analytics`);
  }

  // Assignments
  getActiveAssignments() {
    return this.request<import('@/types').Assignment[]>('/assignments/active');
  }
  getAssignmentHistory(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<import('@/types').Assignment[]>(`/assignments${qs}`);
  }
  assignDriver(data: { driverId: string; areaId: string }) {
    return this.request<import('@/types').Assignment>('/assignments', { method: 'POST', body: JSON.stringify(data) });
  }

  // Deliveries
  getTodayDeliveries(date?: string) {
    const qs = date ? `?date=${date}` : '';
    return this.request<import('@/types').TodayDeliveryItem[]>(`/deliveries/today${qs}`);
  }
  getTodaySummary(date?: string) {
    const qs = date ? `?date=${date}` : '';
    return this.request<Record<string, number | string>>(`/deliveries/summary/today${qs}`);
  }
  saveDelivery(data: Record<string, unknown>) {
    return this.request<import('@/types').Delivery>('/deliveries', { method: 'POST', body: JSON.stringify(data) });
  }
  getDeliveryHistory(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<{ items: import('@/types').Delivery[]; total: number }>(`/deliveries/history${qs}`);
  }

  // Inventory
  getInventory() {
    return this.request<import('@/types').InventorySnapshot>('/inventory');
  }
  updateInventorySettings(data: Record<string, unknown>) {
    return this.request<import('@/types').InventorySnapshot>('/inventory/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  getInventoryReconcile() {
    return this.request<Record<string, unknown>>('/inventory/reconcile');
  }

  // Pricing
  getCurrentPrice() {
    return this.request<{ price: number }>('/pricing/current');
  }
  getPriceHistory() {
    return this.request<Array<{ price: number; effectiveFrom: string; effectiveTo?: string }>>('/pricing/history');
  }
  setPrice(price: number) {
    return this.request<{ price: number }>('/pricing', { method: 'POST', body: JSON.stringify({ price }) });
  }

  // Invoices
  getInvoices(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<{ items: import('@/types').Invoice[]; total: number }>(`/invoices${qs}`);
  }
  generateInvoice(data: Record<string, string>) {
    return this.request<import('@/types').Invoice>('/invoices/generate', { method: 'POST', body: JSON.stringify(data) });
  }
  voidInvoice(id: string) {
    return this.request<import('@/types').Invoice>(`/invoices/${id}/void`, { method: 'PATCH' });
  }
  getInvoicePdfUrl(id: string) {
    return `${API_BASE}/invoices/${id}/pdf`;
  }
  getInvoiceShare(id: string) {
    return this.request<import('@/types').InvoiceShareInfo>(`/invoices/${id}/share`);
  }

  // Payments
  getPaymentSummary() {
    return this.request<Record<string, unknown>>('/payments/summary');
  }
  getPayments(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<{ items: import('@/types').Payment[]; total: number }>(`/payments${qs}`);
  }
  recordPayment(data: Record<string, unknown>) {
    return this.request<import('@/types').Payment>('/payments', { method: 'POST', body: JSON.stringify(data) });
  }

  // Ledger
  getCustomerLedger(customerId: string, params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<{ customer: import('@/types').Customer; items: import('@/types').LedgerEntry[]; total: number }>(
      `/ledger/${customerId}${qs}`
    );
  }
  getLedgerPdfUrl(customerId: string, params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return `${API_BASE}/ledger/${customerId}/pdf${qs}`;
  }
  getLedgerCsvUrl(customerId: string, params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return `${API_BASE}/ledger/${customerId}/csv${qs}`;
  }

  // Cooler Transactions
  getCoolerTransactions(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<{ items: import('@/types').CoolerTransaction[]; total: number }>(`/cooler-transactions${qs}`);
  }
  createCoolerTransaction(data: Record<string, unknown>) {
    return this.request<import('@/types').CoolerTransaction>('/cooler-transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard
  getOperationalDashboard() {
    return this.request<Record<string, unknown>>('/dashboard/operational');
  }
  getSalesOverview() {
    return this.request<Record<string, unknown>>('/dashboard/sales');
  }
  getRevenueTrend(months = 6) {
    return this.request<Array<{ month: string; revenue: number; deliveries: number }>>(
      `/dashboard/charts/revenue-trend?months=${months}`
    );
  }
  getTopCustomers() {
    return this.request<Array<Record<string, unknown>>>('/dashboard/top-customers');
  }
  getAreaSales() {
    return this.request<Array<Record<string, unknown>>>('/dashboard/area-sales');
  }
  getDriverSales() {
    return this.request<Array<Record<string, unknown>>>('/dashboard/driver-sales');
  }
  getAlerts() {
    return this.request<import('@/types').Alert[]>('/dashboard/alerts');
  }

  // Reports
  getCustomerReports() {
    return this.request<Array<Record<string, unknown>>>('/reports/customers');
  }
  getAreaReports() {
    return this.request<Array<Record<string, unknown>>>('/reports/areas');
  }
  getDriverReports() {
    return this.request<Array<Record<string, unknown>>>('/reports/drivers');
  }
  getPaymentReports(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<Record<string, unknown>>(`/reports/payments${qs}`);
  }
  getInventoryReports() {
    return this.request<Record<string, unknown>>('/reports/inventory');
  }

  // Settings
  getAnalyticsRules() {
    return this.request<Record<string, number>>('/settings/analytics-rules');
  }
  updateAnalyticsRules(data: Record<string, number>) {
    return this.request<Record<string, number>>('/settings/analytics-rules', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Audit
  getAuditLogs(page = 1) {
    return this.request<{ items: Array<Record<string, unknown>>; total: number }>(`/audit?page=${page}`);
  }

  // Phase 3 — Settlements
  getSettlements(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<{ items: import('@/types').Settlement[]; total: number }>(`/settlements${qs}`);
  }
  upsertSettlement(data: Record<string, unknown>) {
    return this.request<import('@/types').Settlement>('/settlements', { method: 'POST', body: JSON.stringify(data) });
  }
  submitSettlement(id: string) {
    return this.request<import('@/types').Settlement>(`/settlements/${id}/submit`, { method: 'PATCH' });
  }
  approveSettlement(id: string) {
    return this.request<import('@/types').Settlement>(`/settlements/${id}/approve`, { method: 'PATCH' });
  }
  rejectSettlement(id: string, reason?: string) {
    return this.request<import('@/types').Settlement>(`/settlements/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  // Collections
  getCollections(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<{ items: import('@/types').DriverCollection[]; total: number }>(`/collections${qs}`);
  }
  recordCollection(data: Record<string, unknown>) {
    return this.request<import('@/types').DriverCollection>('/collections', { method: 'POST', body: JSON.stringify(data) });
  }
  reconcileCollection(id: string) {
    return this.request<import('@/types').DriverCollection>(`/collections/${id}/reconcile`, { method: 'PATCH' });
  }
  getCollectionReport(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<Record<string, unknown>>(`/collections/report${qs}`);
  }

  // Expenses
  getExpenses(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<{ items: import('@/types').Expense[]; total: number }>(`/expenses${qs}`);
  }
  createExpense(data: Record<string, unknown>) {
    return this.request<import('@/types').Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) });
  }
  getExpenseSummary(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<Record<string, unknown>>(`/expenses/summary${qs}`);
  }
  deleteExpense(id: string) {
    return this.request<{ message: string }>(`/expenses/${id}`, { method: 'DELETE' });
  }

  // Credit
  getCustomerCredit(id: string) {
    return this.request<import('@/types').CustomerCredit>(`/customers/${id}/credit`);
  }
  updateCustomerCredit(id: string, data: Record<string, unknown>) {
    return this.request<import('@/types').CustomerCredit>(`/customers/${id}/credit`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Customer 360
  getCustomer360(id: string) {
    return this.request<import('@/types').Customer360>(`/customers/${id}/360`);
  }

  // Driver performance
  getDriverPerformance(id: string, params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<import('@/types').DriverPerformance>(`/drivers/${id}/performance${qs}`);
  }

  // Backup
  exportBackup() {
    return this.request<Record<string, unknown>>('/backup/export');
  }
  getBackupDocs() {
    return this.request<Record<string, unknown>>('/backup/docs');
  }

  restoreEntity(entity: 'areas' | 'drivers' | 'customers', id: string) {
    return this.request<{ message: string }>(`/${entity}/${id}/restore`, { method: 'POST' });
  }
}

export const api = new ApiClient();
