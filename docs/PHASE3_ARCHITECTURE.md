# Aqua Flow — Phase 3: Production Hardening & Business Operations

## 1. Phase 2 Review Summary

**Preserved:** Deliveries, cooler transactions, payments (invoice-linked), ledger, operational dashboard, customer analytics, inventory reconciliation.

**Gaps addressed in Phase 3:** Driver settlements, field collections, expenses/P&L, credit limits, scored driver performance, soft delete, backup exports, unified Customer 360, MongoDB transactions, multi-org scaffold.

---

## 2. Schema Changes (Additive Only)

### New Collections

| Collection | Purpose |
|------------|---------|
| `driverdailysettlements` | Opening/closing stock, damages, losses, approval workflow |
| `drivercollections` | Cash/UPI/cheque collected in field (with or without invoice) |
| `expenses` | Business expenses by category |
| `organizations` | Multi-org/branch scaffold (single default org for now) |

### Extended Fields

| Model | New Fields |
|-------|------------|
| `customers` | `creditLimit`, `creditOverride`, `creditOverrideBy`, `creditOverrideReason`, `deletedAt`, `deletedBy`, `organizationId` |
| `areas`, `drivers` | `deletedAt`, `deletedBy`, `organizationId` |
| `payments` | `driverId`, `collectionId`, `settlementId` (optional links) |

### Driver Settlement Formula
```
closingStock = openingStock - deliveriesMade + emptyReturns - damagedCoolers - lostCoolers
variance = closingStock - driverReportedClosing
```

### Profit Formula
```
profit = totalRevenue (deliveries) - totalExpenses
```

### Credit Check
```
effectiveLimit = creditOverride ?? creditLimit (0 = no limit)
availableCredit = effectiveLimit - ledgerBalance (if limit > 0)
block/warn on delivery when ledgerBalance + newCharge > limit
```

---

## 3. Migration Strategy

1. Run `npm run migrate:phase3` — adds default organization, soft-delete nulls, credit defaults
2. All new fields default safely (creditLimit=0, deletedAt=null)
3. Existing APIs unchanged; new endpoints under `/api/v2` prefix NOT used — same `/api` with new routes only
4. Payment POST accepts optional `driverId`/`collectionId` — backward compatible

---

## 4. Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking delivery flow | Transactions optional wrapper; fallback to sequential |
| Double collection entry | Link collection → payment → settlement |
| Credit blocking legitimate sales | Override flag with audit |
| Soft delete hiding data | `?includeDeleted=true` for owner restore |
| Multi-org premature | `organizationId` optional, single default org |

---

## 5. New API Endpoints

```
POST/GET/PATCH  /api/settlements
POST/GET        /api/collections
POST/GET        /api/expenses
GET             /api/expenses/summary
GET/PUT         /api/customers/:id/credit
GET             /api/customers/:id/360
GET             /api/drivers/:id/performance
GET             /api/backup/export
GET             /api/backup/docs
POST            /api/:entity/:id/restore  (soft delete restore)
```

---

## 6. Backup Architecture

- **Export:** JSON dump of all collections via `/api/backup/export`
- **Recovery:** Documented manual restore via `mongorestore` + migration re-run
- **Schedule:** External cron recommended (documented, not automated in-app)
