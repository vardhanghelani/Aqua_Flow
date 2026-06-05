# Aqua Flow — Phase 2 Architecture Upgrade

## 1. Current Architecture Analysis

### What Works (Preserve)
- JWT auth with owner/driver roles
- Daily delivery upsert per customer+date
- Driver area isolation (assignment check)
- Price snapshot on delivery
- Invoice generation from delivery records
- Denormalized customer cooler balance
- Basic inventory snapshot
- Audit log (partial)
- Enterprise UI shell (sidebar, dashboard, driver cards)

### Structural Weaknesses
| Area | Issue |
|------|-------|
| Cooler tracking | Only `filledGiven`/`emptyReturned` — no lost/damaged/replaced |
| Inventory | Manual `inCirculation`; no damaged/lost buckets |
| Billing | Invoice status toggle only — no payment records |
| Ledger | No financial transaction log per customer |
| Reports | `outstandingAmount` = lifetime revenue (wrong) |
| Audit | No old/new values; delivery upserts logged as create |
| Performance | N+1 in area/driver reports; no indexes on status queries |
| Concurrency | Multi-document writes without transactions |

---

## 2. Gap Analysis

| Requirement | Current | Phase 2 Action |
|-------------|---------|----------------|
| Cooler transactions | InventoryTransaction (delivery/adjust only) | New `CoolerTransaction` collection |
| Inventory model | 4 fields | Add damaged, lost, inTransit; reconciliation service |
| Payments | None | New `Payment` + invoice amount tracking |
| Customer ledger | None | New `LedgerEntry` auto-generated |
| Customer analytics | Basic reports | Analytics service + status classification |
| Route readiness | address string | lat/lng/mapsUrl on Customer |
| WhatsApp billing | PDF only | Share link + wa.me template |
| Driver mobile | Partial | Maps link, remarks on mobile, PWA manifest |
| Dashboard | Generic KPIs | Operational sections per spec |
| Reports export | Stub button | CSV/print helpers; date filters |
| Audit | Basic | oldValue/newValue on updates |
| Scalability | Missing indexes | Add compound indexes |

---

## 3. Updated Database Design

### New Collections

#### `coolertransactions`
```
customerId, driverId?, deliveryId?, areaId?
type: delivered | returned | damaged | lost | replaced | adjustment
quantity: number
notes?, reference?, createdBy, createdAt
```
Indexes: `{ customerId, createdAt }`, `{ type, createdAt }`, `{ deliveryId }`

#### `payments`
```
invoiceId, customerId
amount, paymentDate, paymentMethod (cash|upi|bank|cheque|other)
referenceNumber?, notes?
createdBy, createdAt
```
Indexes: `{ invoiceId }`, `{ customerId, paymentDate }`, `{ paymentDate }`

#### `ledgerentries`
```
customerId
date, particular, entryType (delivery_charge|invoice|payment|adjustment|credit|debit)
debit, credit, balance (running)
referenceType?, referenceId?
createdBy, createdAt
```
Indexes: `{ customerId, date }`, `{ customerId, createdAt }`

### Modified Collections

#### `customers` (additive fields)
```
totalLost, totalDamaged, analyticsStatus (active|at_risk|inactive)
latitude?, longitude?, googleMapsUrl?, locationNotes?
```

#### `inventorysettings` (additive fields)
```
damagedStock, lostStock
inTransit (rename semantic: inTransitStock)
```

#### `invoices` (additive + status migration)
```
status: unpaid | partially_paid | paid  (migrate pending→unpaid)
amountPaid, amountDue
dueDate?
```

#### `auditlogs` (additive)
```
oldValue?, newValue? (structured diff)
```

### Inventory Reconciliation Formula
```
totalOwned = warehouse + inTransit + withCustomers + damaged + lost
missing = totalOwned_computed - totalCoolersOwned (should be 0)
```

---

## 4. Updated API Design

| Module | New/Updated Endpoints |
|--------|----------------------|
| Cooler Transactions | `GET /api/cooler-transactions`, `POST /api/cooler-transactions` (owner) |
| Payments | `GET/POST /api/payments`, `GET /api/payments/summary` |
| Ledger | `GET /api/ledger/:customerId`, `GET /api/ledger/:customerId/pdf` |
| Inventory | `GET /api/inventory/reconcile`, `GET /api/inventory/transactions` |
| Customers | `GET /api/customers/:id/analytics`, location fields on PUT |
| Invoices | `GET /api/invoices/:id/share`, payment-aware status |
| Dashboard | `GET /api/dashboard/operational` (unified Phase 2 dashboard) |
| Reports | `GET /api/reports/payments`, `GET /api/reports/inventory`, `?format=csv` |
| Settings | `GET/PUT /api/settings/analytics-rules` |
| Audit | `GET /api/audit?entityType&from&to` with filters |

---

## 5. Migration Strategy

1. **Additive schema changes** — new fields default to 0/null; no data loss
2. **Invoice status** — map `pending` → `unpaid` via migration script + schema enum extension
3. **Cooler transactions** — new deliveries create transactions; optional backfill script for historical deliveries
4. **Ledger** — entries created going forward; optional backfill from invoices/payments
5. **Backward compatible API** — accept legacy `pending` status in PATCH; return both formats during transition
6. **No breaking changes** to delivery POST payload

---

## 6. UI/UX Upgrade Plan

| Screen | Changes |
|--------|---------|
| Dashboard | 3-section operational layout; lost/damaged KPIs; inactive customers |
| Customers | Location fields; analytics badge; drill-down link |
| Customer Detail | NEW — analytics, ledger tab, cooler history |
| Payments | NEW — record payment, outstanding summary |
| Invoices | WhatsApp share, partial payment indicator |
| Inventory | Damaged/lost cards; reconciliation panel |
| Reports | Date filters, CSV export, payment/inventory tabs |
| Driver | Maps button, remarks on mobile, swipe-friendly cards |
| Settings | Analytics rule configuration |

---

## 7. Risk Assessment

| Risk | Mitigation |
|------|------------|
| Balance drift | Reconciliation service + alerts |
| Partial write failure | Sequential writes with rollback attempt; document for future Mongo transactions |
| Ledger inconsistency | Ledger written in same service as payment/invoice |
| Performance regression | New indexes; optimize dashboard single aggregation |
| Breaking invoices | Status enum migration with aliases |

---

## Implementation Order

1. Models + indexes
2. Cooler transaction + delivery integration
3. Inventory reconciliation service
4. Payment + ledger services
5. Customer analytics + location fields
6. Dashboard/report APIs
7. Audit enhancement
8. Frontend pages + API client
9. Migration script
10. Tests
