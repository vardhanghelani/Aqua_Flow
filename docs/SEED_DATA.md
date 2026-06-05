# Reset MongoDB & Load Fresh Sample Data

This **deletes everything** in the database and loads new demo data.

---

## Login after reset

| Role | Login ID | Password |
|------|----------|----------|
| Owner | `owner` | `admin123` |
| Driver (Area A) | `driver1` | `driver123` |
| Driver (Area B) | `driver2` | `driver123` |

---

## Option 1 — From your PC (recommended)

### Local database

```powershell
cd E:\Aqua_Flow\backend
npm run db:reset
```

### Production database (Render / Atlas)

1. Render dashboard → backend → **Environment** → copy `MONGODB_URI`
2. Paste into `backend/.env` as `MONGODB_URI=...`
3. Run:

```powershell
cd E:\Aqua_Flow\backend
npm run db:reset
```

4. Restore local `.env` afterward if needed

Both `npm run seed` and `npm run db:reset` do the same thing: **wipe DB + reload sample data**.

---

## Option 2 — On Render (no Shell on free tier)

1. Render → backend → **Environment**
2. Add: `SEED_RESET=true`
3. **Manual Deploy** (or push to GitHub)
4. Wait for deploy — logs should show `Wiped database` and `fresh database loaded`
5. **Remove** `SEED_RESET` and redeploy (important — otherwise it wipes on every restart)

---

## What gets wiped

The entire MongoDB database is dropped (`dropDatabase`), including:

- users, drivers, areas, customers, assignments
- deliveries, invoices, payments, ledger
- settlements, collections, expenses, inventory, audit logs

---

## What gets created (new sample data)

| Data | Details |
|------|---------|
| **Areas** | Area A, B, C |
| **Customers** | 9 shops (4 in A, 3 in B, 2 in C) |
| **Assignments** | driver1 → Area A, driver2 → Area B |
| **Deliveries** | 5 records (today + past days, incl. 1 skipped) |
| **Inventory** | 1000 coolers, 800 in warehouse |
| **Pricing** | ₹20 default |
| **Invoice** | 1 unpaid invoice for Patel Pan Shop |
| **Collection** | 1 unreconciled cash collection (driver1) |
| **Expense** | 1 fuel expense sample |

---

## Atlas alternative

MongoDB Atlas → **Browse Collections** → select database → **⋯** → **Drop Database**, then run `npm run db:reset` with that URI.
