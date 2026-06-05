# Aqua Flow — UX Simplification & Mobile-First Redesign

## Analysis (Current State)

### Complexity issues

| Area | Problem |
|------|---------|
| Owner home | ERP-style charts, KPI grid, and tables before daily actions |
| Sidebar | 14 flat links — users must know module names |
| Driver deliveries | All customers fully expanded; settlement prominent; stat clutter |
| Driver history | Data table on mobile |
| Assignments | Framed as “New Assignment” daily task; table-heavy |
| Owner deliveries | Missing customer, driver, area columns despite API support |

### Navigation waste

- Owner must open Dashboard → sidebar → module for routine work
- Driver sees settlement card before customer list
- Performance charts belong in Reports, not home

### Simplified workflows

**Owner daily loop:** Home → see today’s numbers → tap card or quick action → done.

**Driver daily loop:** Open app → tap customer → adjust qty → Save → next customer.

**Assignment loop (infrequent):** View current mappings → tap “Change” only when needed → history auto-saved.

---

## Wireframes (Mobile-First)

### Owner — Home

```
┌─────────────────────────────┐
│ Aqua Flow        🔔  👤     │
├─────────────────────────────┤
│ Today                       │
│ Friday, 5 June 2026         │
│                             │
│ TODAY'S OPERATIONS          │
│ ┌──────────┐ ┌──────────┐   │
│ │ ✓ Done   │ │ ⏳ Pend  │   │
│ │   12     │ │    8     │   │
│ └──────────┘ └──────────┘   │
│ ┌──────────┐ ┌──────────┐   │
│ │ 💰 Due   │ │ 📦 Stock │   │
│ │ ₹24,500  │ │ Healthy  │   │
│ └──────────┘ └──────────┘   │
│                             │
│ QUICK ACTIONS               │
│ [Assign Driver] [Deliveries]│
│ [Invoice] [Payment] [Search]│
│                             │
│ ⚠ Alerts (2)                │
└─────────────────────────────┘
```

### Driver — Today’s Customers

```
┌─────────────────────────────┐
│ 3 of 12 completed  ███░░ 25%│
├─────────────────────────────┤
│ Patel Pan Shop              │
│ Balance: 4  ·  Last: 2 days │
│         [ Delivered ]       │
├─────────────────────────────┤
│ (tap expands)               │
│  Given [−] 2 [+]            │
│  Returned [−] 2 [+]         │
│  [ Save ]  [ Next ]         │
└─────────────────────────────┘
```

### Assignments — Long-term mapping

```
┌─────────────────────────────┐
│ Area Mappings               │
│ These stay until you change │
│                             │
│ ┌ Driver A → Area A ─────┐  │
│ │ Since 12 Jan 2026      │  │
│ │ [ Change assignment ]  │  │
│ └────────────────────────┘  │
│                             │
│ History                     │
│ • A → B ended 1 Mar (Owner) │
└─────────────────────────────┘
```

---

## Implementation Notes

- **No new business features** — reuse existing APIs only
- **No DB changes** — assignment “reason” not stored; UI shows assigned/changed dates from existing fields
- **Charts moved** off home; Reports page retains analytics
- **Color system:** `#FFFFFF` bg, `#E5E7EB` borders, `#2563EB` primary, `#16A34A` success, `#F59E0B` warning, `#DC2626` danger

---

## Success Criteria

- **Owner test:** Understand home screen in ≤30 seconds
- **Driver test:** Complete one delivery entry in ≤10 seconds (tap → qty → save)
