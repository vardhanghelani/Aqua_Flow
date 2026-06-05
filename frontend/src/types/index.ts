export type UserRole = 'owner' | 'driver';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  driverId?: string;
}

export interface Area {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Driver {
  _id: string;
  name: string;
  mobile: string;
  isActive: boolean;
  userId?: { email: string; isActive: boolean };
}

export type AnalyticsStatus = 'active' | 'at_risk' | 'inactive';

export interface Customer {
  _id: string;
  name: string;
  shopName: string;
  mobile: string;
  address: string;
  areaId: Area | string;
  customPrice?: number;
  status: 'active' | 'inactive';
  totalFilledGiven: number;
  totalEmptyReturned: number;
  currentBalance: number;
  totalLost?: number;
  totalDamaged?: number;
  analyticsStatus?: AnalyticsStatus;
  ledgerBalance?: number;
  lastDeliveryDate?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  locationNotes?: string;
}

export interface Delivery {
  _id: string;
  customerId: string;
  driverId: string;
  areaId: string;
  deliveryDate: string;
  deliveryTime?: string;
  status: 'delivered' | 'not_delivered';
  filledGiven: number;
  emptyReturned: number;
  unitPrice: number;
  billableAmount: number;
  remarks?: string;
}

export interface TodayDeliveryItem {
  customer: Customer;
  delivery: Delivery | null;
}

export interface Assignment {
  _id: string;
  driverId: Driver | string;
  areaId: Area | string;
  assignedBy: { name: string };
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface InventorySnapshot {
  totalCoolersOwned: number;
  warehouseStock: number;
  inTransit?: number;
  customerHoldings: number;
  inCirculation: number;
  damagedStock?: number;
  lostStock?: number;
  computedTotal?: number;
  missingCoolers: number;
  isBalanced: boolean;
}

export type InvoiceStatus = 'pending' | 'unpaid' | 'partially_paid' | 'paid';

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerId: Customer;
  periodStart: string;
  periodEnd: string;
  invoiceType: string;
  items: Array<{
    deliveryId: string;
    date: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  totalQuantity: number;
  totalAmount: number;
  amountPaid?: number;
  amountDue?: number;
  status: InvoiceStatus;
  dueDate?: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  invoiceId: Invoice | string;
  customerId: Customer | string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'upi' | 'bank' | 'cheque' | 'other';
  referenceNumber?: string;
  notes?: string;
}

export interface LedgerEntry {
  _id: string;
  date: string;
  particular: string;
  entryType: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CoolerTransaction {
  _id: string;
  customerId: Customer | string;
  type: 'delivered' | 'returned' | 'damaged' | 'lost' | 'replaced' | 'adjustment';
  quantity: number;
  notes?: string;
  createdAt: string;
}

export interface InvoiceShareInfo {
  invoiceNumber: string;
  shareMessage: string;
  whatsappUrl: string;
  pdfUrl: string;
  amount: number;
  amountDue: number;
  customerName: string;
  shopName: string;
  mobile: string;
}

export interface Alert {
  type: string;
  severity: 'warning' | 'critical' | 'info';
  message: string;
  entityId?: string;
  entityName?: string;
}

export interface CustomerAnalytics {
  customerId: string;
  name: string;
  shopName: string;
  totalDeliveries: number;
  totalQuantity: number;
  totalRevenue: number;
  averagePurchaseFrequency: string;
  lastDeliveryDate?: string;
  daysSinceLastDelivery?: number | null;
  outstandingAmount: number;
  ledgerBalance: number;
  currentCoolerBalance: number;
  lostCoolers: number;
  damagedCoolers: number;
  analyticsStatus: AnalyticsStatus;
  monthlyTrend: Array<{ _id: string; quantity: number; revenue: number }>;
  location: {
    latitude?: number;
    longitude?: number;
    googleMapsUrl?: string;
    locationNotes?: string;
    address: string;
  };
}

export interface Settlement {
  _id: string;
  driverId: Driver | string;
  settlementDate: string;
  openingStock: number;
  deliveriesMade: number;
  emptyReturns: number;
  damagedCoolers: number;
  lostCoolers: number;
  closingStock: number;
  expectedClosing: number;
  variance: number;
  cashCollected: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  notes?: string;
  rejectedReason?: string;
}

export interface DriverCollection {
  _id: string;
  driverId: Driver | string;
  customerId?: Customer | string;
  invoiceId?: Invoice | string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'cheque' | 'bank' | 'other';
  collectionDate: string;
  referenceNumber?: string;
  reconciled: boolean;
}

export interface Expense {
  _id: string;
  category: 'diesel' | 'salary' | 'maintenance' | 'office' | 'other';
  description: string;
  amount: number;
  expenseDate: string;
  referenceNumber?: string;
}

export interface CustomerCredit {
  creditLimit: number;
  creditOverride?: number;
  effectiveLimit: number;
  outstanding: number;
  availableCredit: number | null;
  status: 'ok' | 'warning' | 'over_limit' | 'no_limit';
  isOverLimit: boolean;
  isNearLimit: boolean;
  overdueCount: number;
  overdueAmount: number;
}

export interface Customer360 {
  customer: Customer;
  analytics: CustomerAnalytics;
  credit: CustomerCredit;
  deliveries: Delivery[];
  payments: Payment[];
  invoices: Invoice[];
  ledger: LedgerEntry[];
  coolerTransactions: CoolerTransaction[];
  timeline: Array<{
    type: string;
    date: string;
    title: string;
    amount: number;
  }>;
}

export interface DriverPerformance {
  driver: { id: string; name: string; mobile: string };
  period: { from: string; to: string };
  metrics: Record<string, number>;
  scores: {
    delivery: number;
    collection: number;
    attendance: number;
    damagePenalty: number;
    overall: number;
  };
  grade: string;
}
