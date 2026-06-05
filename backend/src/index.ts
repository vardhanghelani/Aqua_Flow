import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { validateEnvironment } from './config/env';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { securityHeaders, loginRateLimiter, apiRateLimiter } from './middleware/security';

import authRoutes from './routes/auth.routes';
import areasRoutes from './routes/areas.routes';
import driversRoutes from './routes/drivers.routes';
import customersRoutes from './routes/customers.routes';
import assignmentsRoutes from './routes/assignments.routes';
import deliveriesRoutes from './routes/deliveries.routes';
import inventoryRoutes from './routes/inventory.routes';
import pricingRoutes from './routes/pricing.routes';
import invoicesRoutes from './routes/invoices.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportsRoutes from './routes/reports.routes';
import auditRoutes from './routes/audit.routes';
import paymentsRoutes from './routes/payments.routes';
import ledgerRoutes from './routes/ledger.routes';
import coolerTransactionsRoutes from './routes/coolerTransactions.routes';
import settingsRoutes from './routes/settings.routes';
import settlementsRoutes from './routes/settlements.routes';
import collectionsRoutes from './routes/collections.routes';
import expensesRoutes from './routes/expenses.routes';
import backupRoutes from './routes/backup.routes';
import restoreRoutes from './routes/restore.routes';

validateEnvironment();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(securityHeaders);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use('/api', apiRateLimiter);

app.get('/api/health', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbOk = dbState === 1;
  res.status(dbOk ? 200 : 503).json({
    success: dbOk,
    message: dbOk ? 'Aqua Flow API is running' : 'Database not connected',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth/login', loginRateLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/cooler-transactions', coolerTransactionsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/settlements', settlementsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api', restoreRoutes);

app.use(errorHandler);

async function start() {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
