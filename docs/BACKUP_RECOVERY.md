# Aqua Flow — Backup & Recovery

## Architecture

| Layer | Method |
|-------|--------|
| In-app export | `GET /api/backup/export` (owner) — JSON snapshot of all collections |
| Production backup | External `mongodump` on a daily cron |
| Off-site copy | Weekly copy to cloud storage (S3, GCS, etc.) |
| Retention | Minimum 30 days |

## Export (Manual)

```bash
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/backup/export > backup.json
```

## Recovery Process

1. **Stop the application** to prevent writes during restore.
2. **Restore MongoDB** using one of:
   - `mongorestore --uri="mongodb://localhost:27017/aqua_flow" ./dump/aqua_flow`
   - Or import JSON via a custom import script from `/api/backup/export` output
3. **Run migrations:**
   ```bash
   cd backend
   npm run migrate:phase2
   npm run migrate:phase3
   ```
4. **Verify:** `GET /api/health` and login with owner credentials.
5. **Spot-check:** customers, deliveries, invoices, ledger balances.

## Recommended Production Schedule

```
Daily  02:00  mongodump --uri=$MONGODB_URI --out=/backups/$(date +%Y%m%d)
Weekly Sunday  rsync /backups to off-site storage
Monthly        Test restore on staging environment
```

## Collections Included in Export

users, areas, drivers, customers, deliveries, invoices, payments, ledgerentries, coolertransactions, driverdailysettlements, drivercollections, expenses, organizations, and related master data.
