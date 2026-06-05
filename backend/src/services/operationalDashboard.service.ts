import { Delivery, Invoice, Customer } from '../models';
import { startOfDay, endOfDay } from '../utils/date';
import { getInventorySnapshot } from './inventory.service';
import { getPaymentSummary } from './payment.service';
import { getCoolerSummary } from './coolerTransaction.service';
import { getInactiveCustomers } from './customerAnalytics.service';
import { getRevenueTrend, getAreaWiseSales, getDriverWiseSales } from './dashboard.service';

export async function getOperationalDashboard() {
  const today = startOfDay();
  const todayEnd = endOfDay();

  const [
    todayDeliveries,
    inventory,
    payments,
    coolerSummary,
    inactiveCustomers,
    revenueTrend,
    areaSales,
    driverSales,
    recentDeliveries,
    driversWorkedToday,
  ] = await Promise.all([
    Delivery.aggregate([
      { $match: { deliveryDate: { $gte: today, $lte: todayEnd }, status: 'delivered' } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: '$billableAmount' },
          quantity: { $sum: '$filledGiven' },
        },
      },
    ]),
    getInventorySnapshot(),
    getPaymentSummary(),
    getCoolerSummary(),
    getInactiveCustomers(10),
    getRevenueTrend(6),
    getAreaWiseSales(),
    getDriverWiseSales(),
    Delivery.find({ status: 'delivered' })
      .populate('customerId', 'shopName')
      .populate('driverId', 'name')
      .sort({ deliveryDate: -1, deliveryTime: -1 })
      .limit(8),
    Delivery.distinct('driverId', {
      deliveryDate: { $gte: today, $lte: todayEnd },
      status: 'delivered',
    }),
  ]);

  const todayStats = todayDeliveries[0] ?? { count: 0, revenue: 0, quantity: 0 };
  const activeCustomers = await Customer.countDocuments({ status: 'active' });

  return {
    section1: {
      todayDeliveries: todayStats.count,
      todayRevenue: todayStats.revenue,
      todayQuantity: todayStats.quantity,
      outstandingPayments: payments.totalOutstanding,
      outstandingInvoiceCount: payments.outstandingInvoiceCount,
      warehouseStock: inventory.warehouseStock,
      coolersWithCustomers: inventory.customerHoldings,
      lostCoolers: coolerSummary.totalLost,
      damagedCoolers: coolerSummary.totalDamaged,
      activeCustomers,
      driversWorkedToday: driversWorkedToday.length,
      inventoryHealthy: inventory.isBalanced,
    },
    section2: {
      revenueTrend,
      areaPerformance: areaSales,
      driverPerformance: driverSales,
    },
    section3: {
      recentDeliveries,
      pendingPayments: {
        total: payments.totalOutstanding,
        count: payments.outstandingInvoiceCount,
        overdueCount: payments.overdueCount,
        recentCollections: payments.recentCollections,
      },
      inventoryAlerts: inventory.isBalanced
        ? []
        : [{ type: 'inventory_mismatch', message: `${inventory.missingCoolers} coolers unaccounted` }],
      inactiveCustomers,
    },
  };
}
