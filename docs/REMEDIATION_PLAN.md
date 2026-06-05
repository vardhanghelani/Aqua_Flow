# Aqua Flow — Production Remediation Plan

## Accounting Model (C1, C2)

**Chosen model:** Delivery = operational only. Invoice = debit. Payment = credit.

| Event | Ledger action |
|-------|---------------|
| Delivery saved/edited | None |
| Invoice generated | Debit (`invoice`) |
| Invoice voided | Reversal credit (`reversal`) |
| Payment recorded | Credit (`payment`) |
| Payment reversed | Reversal debit (`reversal`) |

**Credit check:** `ledgerBalance + uninvoicedDeliveries + newDeliveryAmount` vs limit.

## Migration (`npm run migrate:ledger`)

1. Create reversal entries for all historical `delivery_charge` debits
2. Recalculate `customer.ledgerBalance` from entry chain
3. Sync invoice statuses from payments

## Files Affected

- `ledger.service.ts`, `delivery.service.ts`, `invoice.service.ts`, `payment.service.ts`, `credit.service.ts`
- `migrate-ledger-remediation.ts`
- `config/env.ts`, `utils/transaction.ts`, `utils/sanitize.ts`, `utils/driverAuth.ts`
- `backup.service.ts`, `jwt.ts`, `master.controller.ts`, `phase3.controller.ts`
- `settlement.service.ts`, `index.ts`, `invoices.routes.ts`
- Frontend: `CustomerDetailPage`, `LoginPage`, driver settlement UI

## Backward Compatibility

- Existing API paths unchanged
- `PATCH /invoices/:id/status` removed (status derived from payments)
- `POST /invoices/:id/void` added for void with reversal
