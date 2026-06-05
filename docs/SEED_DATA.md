# Aqua Flow — Sample / Demo Data

Run the seed script to load test data into MongoDB:

```bash
cd backend
npm run seed
```

**Warning:** This **deletes** existing users, areas, drivers, customers, assignments, deliveries, invoices, payments, and related demo records, then recreates sample data.

For production (Render), run the same command in **Render Shell** on the backend service.

---

## Login credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@aquaflow.com` | `admin123` |
| Driver (Area A) | `driver1@aquaflow.com` | `driver123` |
| Driver (Area B) | `driver2@aquaflow.com` | `driver123` |

Passwords are stored **hashed** (bcrypt) in MongoDB — you cannot read the plain password from the database.

---

## MongoDB collections (documents)

| Collection | What is stored |
|------------|----------------|
| `users` | Login accounts (`email`, hashed `password`, `role`: owner \| driver) |
| `drivers` | Driver profile (`name`, `mobile`, link to `users` via `userId`) |
| `areas` | Area A, Area B, Area C |
| `customers` | 6 sample shops with addresses and cooler balances |
| `driverareaassignments` | Driver 1 → Area A, Driver 2 → Area B (active) |
| `pricehistories` | Default cooler price ₹20 |
| `inventorysettings` | Total coolers, warehouse stock |
| `deliveries` | 3 sample delivery records |

---

## Sample business data

**Areas:** Area A (North), Area B (South), Area C (East)

**Driver 1 (Area A) customers:**
- Ramesh General Store
- Patel Pan Shop
- Meena Kirana

**Driver 2 (Area B) customers:**
- Sharma Electronics
- Gupta Medical Store

**Area C:** Singh Restaurant (no driver assigned — for testing owner assignment flow)

**Deliveries:** One completed today for Driver 1 (Ramesh); Patel and Meena still pending on today's route.
