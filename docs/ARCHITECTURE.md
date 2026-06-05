# Aqua Flow — Water Cooler Distribution Management System

## 1. Business Workflow Analysis

### Actors
| Actor | Responsibility |
|-------|----------------|
| **Owner/Admin** | Master data, assignments, inventory, billing, reports |
| **Driver** | Daily delivery marking for assigned area customers only |

### Core Loop (Daily)
```
Owner sets up Areas → Drivers → Customers (per Area)
        ↓
Owner assigns Driver ↔ Area (historical, never deleted)
        ↓
Driver logs in → sees only today's customers in assigned area
        ↓
Per customer: Delivered / Not Delivered
        ↓
If delivered: record filled given, empty returned, qty, remarks
        ↓
System updates: customer cooler balance, inventory, billable amount (price snapshot)
```

### Exchange Model
Each delivery records **two independent counters**:
- `filledGiven` — filled coolers delivered (billable)
- `emptyReturned` — empty coolers collected

All combinations are valid (2 given / 1 returned, 1 given / 0 returned, etc.).

**Customer cooler balance** = Σ(filledGiven) − Σ(emptyReturned) across all deliveries.

**Inventory identity** (must always reconcile):
```
warehouseStock + customerHoldings = totalCoolersOwned
```
- `customerHoldings` = Σ(customer.currentBalance)
- `inCirculation` = coolers loaded with drivers (optional tracked field)
- `missingCoolers` = totalOwned − warehouse − customerHoldings − inCirculation

### Billing Rules
- Billable quantity = `filledGiven` per delivery (not returns)
- Price resolved at delivery time: `customer.customPrice ?? activeGlobalPrice`
- Price **snapshot** stored on delivery — never retroactively changed
- Invoices aggregate delivery records in a date range — never manual counts

### Driver Area Assignment
- One active assignment per area at a time (enforced)
- Historical records preserved with `startDate` / `endDate`
- Owner can query who served which area on any date

---

## 2. Database Schema (MongoDB)

### Collections

#### `users`
| Field | Type | Notes |
|-------|------|-------|
| name | String | |
| loginId | String | unique, used to sign in |
| password | String | bcrypt hash |
| role | enum | `owner`, `driver` |
| driverProfile | ObjectId → drivers | if role=driver |
| isActive | Boolean | |
| createdBy, updatedBy | ObjectId | |
| timestamps | | |

#### `areas`
| Field | Type |
|-------|------|
| name | String (unique) |
| description | String |
| isActive | Boolean |

#### `drivers`
| Field | Type |
|-------|------|
| userId | ObjectId → users |
| name | String |
| mobile | String |
| isActive | Boolean |

#### `customers`
| Field | Type |
|-------|------|
| name, shopName, mobile, address | String |
| areaId | ObjectId → areas |
| customPrice | Number (optional) |
| status | `active` \| `inactive` |
| totalFilledGiven | Number (denormalized) |
| totalEmptyReturned | Number (denormalized) |
| currentBalance | Number (denormalized) |
| lastDeliveryDate | Date |

#### `driverAreaAssignments`
| Field | Type |
|-------|------|
| driverId | ObjectId |
| areaId | ObjectId |
| assignedBy | ObjectId → users |
| startDate | Date |
| endDate | Date (null = current) |
| isActive | Boolean |

**Index**: `{ areaId, isActive }` — one active assignment per area

#### `deliveries`
| Field | Type |
|-------|------|
| customerId, driverId, areaId | ObjectId |
| deliveryDate | Date (day precision) |
| deliveryTime | Date |
| status | `delivered` \| `not_delivered` |
| filledGiven | Number |
| emptyReturned | Number |
| unitPrice | Number (snapshot) |
| billableAmount | Number |
| remarks | String |
| createdBy, updatedBy | ObjectId |

**Unique index**: `{ customerId, deliveryDate }` — one record per customer per day

#### `priceHistory`
| Field | Type |
|-------|------|
| price | Number |
| effectiveFrom | Date |
| effectiveTo | Date (null = current) |
| changedBy | ObjectId |

#### `inventorySettings` (singleton)
| Field | Type |
|-------|------|
| totalCoolersOwned | Number |
| warehouseStock | Number |
| inCirculation | Number |
| missingCoolers | Number (computed) |

#### `inventoryTransactions`
| Field | Type |
|-------|------|
| type | `delivery` \| `adjustment` \| `initial` |
| deliveryId | ObjectId (optional) |
| filledOut | Number |
| emptyIn | Number |
| warehouseAfter | Number |
| notes | String |
| createdBy | ObjectId |

#### `invoices`
| Field | Type |
|-------|------|
| invoiceNumber | String (unique) |
| customerId | ObjectId |
| periodStart, periodEnd | Date |
| invoiceType | `monthly` \| `weekly` \| `custom` |
| items | [{ deliveryId, date, quantity, unitPrice, amount }] |
| totalQuantity | Number |
| totalAmount | Number |
| status | `pending` \| `paid` |
| generatedBy | ObjectId |

#### `auditLogs`
| Field | Type |
|-------|------|
| userId | ObjectId |
| action | `create` \| `update` \| `delete` |
| entityType | String |
| entityId | ObjectId |
| changes | Mixed |
| ipAddress | String |

---

## 3. API Structure

### Auth `/api/auth`
- `POST /register` — seed owner (dev only)
- `POST /login`
- `GET /me`

### Areas `/api/areas` (owner)
- CRUD + list

### Drivers `/api/drivers` (owner)
- CRUD + list

### Customers `/api/customers`
- CRUD (owner)
- `GET /my-area` (driver — filtered by assignment)

### Assignments `/api/assignments` (owner)
- `POST /` — assign driver to area (closes previous)
- `GET /` — list with filters
- `GET /history` — date-range query

### Deliveries `/api/deliveries`
- `GET /today` — driver's today list
- `POST /` — create/update daily delivery
- `GET /history` — filters: customer, driver, date range
- `GET /summary/today` — driver daily summary

### Inventory `/api/inventory` (owner)
- `GET /` — current snapshot
- `PUT /settings` — update total owned / warehouse
- `POST /adjust` — manual adjustment

### Pricing `/api/pricing` (owner)
- `GET /current`
- `POST /` — new price (closes previous history entry)
- `GET /history`

### Invoices `/api/invoices` (owner)
- `POST /generate` — { customerId, periodStart, periodEnd, type }
- `GET /` — list
- `GET /:id` — detail
- `GET /:id/pdf` — PDF export

### Dashboard `/api/dashboard` (owner)
- `GET /sales` — today/month/year totals
- `GET /charts/revenue-trend`
- `GET /top-customers`
- `GET /area-sales`
- `GET /driver-sales`

### Reports `/api/reports`
- `GET /customers`
- `GET /areas`
- `GET /drivers`

### Notifications `/api/notifications` (owner)
- `GET /alerts` — computed alerts

### Audit `/api/audit` (owner)
- `GET /` — paginated logs

---

## 4. Folder Structure

```
Aqua_Flow/
├── docs/ARCHITECTURE.md
├── backend/
│   ├── src/
│   │   ├── config/database.ts
│   │   ├── models/          # Mongoose schemas
│   │   ├── middleware/      # auth, audit, error
│   │   ├── services/        # business logic
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── types/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/ui/   # ShadCN
│   │   ├── components/layout/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── owner/
│   │   │   └── driver/
│   │   ├── hooks/
│   │   ├── lib/api.ts
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
└── README.md
```

---

## 5. UI Screens

### Owner
| Screen | Purpose |
|--------|---------|
| Dashboard | Sales KPIs, charts, alerts |
| Areas | CRUD |
| Drivers | CRUD |
| Customers | CRUD with area filter |
| Assignments | Assign driver ↔ area, history table |
| Inventory | Stock snapshot, adjustments |
| Pricing | Current price + history |
| Invoices | Generate, list, PDF/print |
| Reports | Customer / Area / Driver tabs |
| Audit Log | Searchable activity |

### Driver
| Screen | Purpose |
|--------|---------|
| Today's Deliveries | Customer list with deliver checkbox, qty, returns, remarks |
| Daily Summary | Count delivered / not delivered |
| My History | Past delivery records |

---

## 6. Architecture Decisions

1. **Denormalized customer balances** — updated atomically on each delivery for fast reports; reconciled from delivery sum on demand.
2. **Price snapshot on delivery** — immutable billing; `priceHistory` only affects new deliveries.
3. **One delivery per customer per day** — upsert pattern prevents duplicates.
4. **Assignment closure** — new assignment auto-sets `endDate` on previous active record.
5. **JWT auth** — access token in memory + refresh in httpOnly cookie (simplified: single JWT for MVP).
6. **Service layer** — controllers thin; inventory/billing logic in services for testability.
7. **Audit middleware** — hooks on write operations for owner accountability.

---

## 7. Edge Cases

| Case | Handling |
|------|----------|
| Driver reassigned mid-day | Today's deliveries tied to `driverId` at save time; area from assignment |
| Customer inactive | Hidden from driver list; owner can still view history |
| Duplicate delivery same day | Upsert by customerId+date |
| Price change mid-day | Each save uses price at moment of save |
| filledGiven=0, emptyReturned>0 | Valid — reduces customer balance, no bill |
| Invoice regeneration same period | Block if invoice exists; or create revision |
| Warehouse stock negative | Validation warning + alert notification |
| Customer excessive coolers | Alert when balance > threshold (configurable, default 10) |
| No delivery for N days | Alert in notifications (default 7 days) |
| Driver sees other areas | Enforced server-side via assignment check |

---

## 8. Implementation Phases

| Phase | Scope |
|-------|-------|
| 1 | MongoDB models + indexes |
| 2 | JWT auth + role middleware |
| 3 | Areas, Drivers, Customers CRUD |
| 4 | Driver-Area assignments |
| 5 | Delivery tracking (driver + owner views) |
| 6 | Inventory reconciliation |
| 7 | Billing + invoices + PDF |
| 8 | Analytics dashboard |
| 9 | Reports + notifications |
| 10 | Integration testing |
