import { Customer, Invoice, InventorySettings } from '../models';
import { Types } from 'mongoose';
import { getInventorySnapshot } from './inventory.service';

const EXCESSIVE_COOLER_THRESHOLD = 10;
const UNSERVICED_DAYS_THRESHOLD = 7;
const LOW_STOCK_THRESHOLD = 50;

export interface Alert {
  type: string;
  severity: 'warning' | 'critical' | 'info';
  message: string;
  entityId?: string;
  entityName?: string;
}

export async function getAlerts(organizationId?: string): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const now = Date.now();
  const orgMatch = organizationId ? { organizationId: new Types.ObjectId(organizationId) } : {};

  const excessiveCustomers = await Customer.find({
    ...orgMatch,
    status: 'active',
    currentBalance: { $gt: EXCESSIVE_COOLER_THRESHOLD },
  }).select('name shopName currentBalance');

  for (const c of excessiveCustomers) {
    alerts.push({
      type: 'excessive_coolers',
      severity: 'warning',
      message: `${c.shopName} holds ${c.currentBalance} coolers (threshold: ${EXCESSIVE_COOLER_THRESHOLD})`,
      entityId: c._id.toString(),
      entityName: c.shopName,
    });
  }

  const unservicedCustomers = await Customer.find({
    ...orgMatch,
    status: 'active',
    $or: [
      { lastDeliveryDate: { $lt: new Date(now - UNSERVICED_DAYS_THRESHOLD * 86400000) } },
      { lastDeliveryDate: { $exists: false } },
    ],
  }).select('name shopName lastDeliveryDate');

  for (const c of unservicedCustomers) {
    alerts.push({
      type: 'unserviced_customer',
      severity: 'info',
      message: `${c.shopName} not serviced recently`,
      entityId: c._id.toString(),
      entityName: c.shopName,
    });
  }

  const inventory = organizationId
    ? await getInventorySnapshot(organizationId)
    : { isBalanced: true, missingCoolers: 0, warehouseStock: 999 };
  if (organizationId && !inventory.isBalanced) {
    alerts.push({
      type: 'inventory_mismatch',
      severity: 'critical',
      message: `Inventory mismatch: ${inventory.missingCoolers} coolers unaccounted for`,
    });
  }

  if (organizationId && inventory.warehouseStock < LOW_STOCK_THRESHOLD) {
    alerts.push({
      type: 'low_warehouse_stock',
      severity: 'warning',
      message: `Low warehouse stock: ${inventory.warehouseStock} coolers remaining`,
    });
  }

  const pendingInvoices = await Invoice.countDocuments({ ...orgMatch, status: 'pending' });
  if (pendingInvoices > 0) {
    alerts.push({
      type: 'pending_invoices',
      severity: 'info',
      message: `${pendingInvoices} pending invoice(s) awaiting payment`,
    });
  }

  return alerts;
}
