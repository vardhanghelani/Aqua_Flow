# Aqua Flow — Enterprise UI/UX Design System

## Design Philosophy

**Primary goal:** Fast daily operations. Delivery entries in seconds.

| Principle | Application |
|-----------|-------------|
| Calm & organized | Neutral backgrounds, clear hierarchy, no decorative noise |
| Workflow-first | Most-used actions visible without scrolling |
| Industrial trust | ERP-grade density, not startup marketing aesthetics |
| Mobile-critical | Driver UI optimized for cheap Android devices |

**References:** ERPNext, Zoho Inventory, Tally Prime (modern), Odoo, Google Workspace.

---

## Color Tokens

### Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--brand-primary` | `#2563EB` | Primary actions, active nav, links |
| `--brand-secondary` | `#0F766E` | Water/supply accents, secondary CTAs |
| `--success` | `#16A34A` | Delivered, paid, balanced inventory |
| `--warning` | `#F59E0B` | Pending, low stock, attention |
| `--danger` | `#DC2626` | Errors, not delivered, mismatch |
| `--info` | `#0284C7` | Informational alerts |
| `--bg-page` | `#F8FAFC` | Page background |
| `--bg-card` | `#FFFFFF` | Cards, sidebar, navbar |
| `--text-primary` | `#0F172A` | Headings, primary text |
| `--text-secondary` | `#475569` | Labels, descriptions |
| `--border` | `#E2E8F0` | Dividers, inputs |

### Dark Mode

| Token | Hex |
|-------|-----|
| `--bg-page` | `#0F172A` |
| `--bg-card` | `#1E293B` |
| `--border` | `#334155` |
| `--text-primary` | `#F8FAFC` |

---

## Typography Scale (Inter)

| Level | Size | Weight | Use |
|-------|------|--------|-----|
| Display | 30px | 700 | Dashboard greeting |
| H1 | 24px | 600 | Page titles |
| H2 | 20px | 600 | Section headers |
| H3 | 16px | 600 | Card titles |
| Body | 14px | 400 | Default text |
| Body Medium | 14px | 500 | Table cells, labels |
| Caption | 12px | 400 | Meta, timestamps |
| KPI Value | 28px | 700 | Stat card numbers |

---

## Spacing System (4px base)

| Token | Value |
|-------|-------|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |

**Layout:** Sidebar 260px · Content max-width 1600px · Card padding 20px · Touch target min 44px

---

## Component Inventory

| Component | Purpose |
|-----------|---------|
| `StatCard` | KPI metrics with icon, label, value, trend |
| `AlertCard` | Inventory/payment/customer alerts |
| `DeliveryCard` | Driver delivery entry (touch-optimized) |
| `InventoryCard` | Stock snapshot with status indicator |
| `DataTable` | Sortable, searchable, paginated tables |
| `SearchBar` | Global and inline search |
| `NumberStepper` | +/- quantity for drivers |
| `EmptyState` | No-data with CTA |
| `Skeleton` | Loading placeholders |
| `PageHeader` | Title, breadcrumb, actions |
| `TopNavbar` | Search, notifications, profile, theme |
| `Sidebar` | Collapsible 260px navigation |
| `MobileBottomNav` | Driver bottom tabs |

---

## Page Wireframes

### Owner Dashboard (Desktop)

```
┌──────────┬──────────────────────────────────────────────────────┐
│ Sidebar  │ TopNavbar [Search] [Alerts] [Theme] [Profile]        │
│ 260px    ├──────────────────────────────────────────────────────┤
│          │ Dashboard                                            │
│ Dashboard│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│ Customers│ │KPI │ │KPI │ │KPI │ │KPI │ │KPI │ │KPI │         │
│ Areas    │ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘         │
│ ...      │ ┌─────────────────┐ ┌─────────────────┐             │
│          │ │ Revenue Trend   │ │ Area Performance│             │
│          │ └─────────────────┘ └─────────────────┘             │
│          │ ┌─────────────────┐ ┌─────────────────┐             │
│          │ │ Recent Deliveries │ │ Alerts          │             │
│          │ └─────────────────┘ └─────────────────┘             │
└──────────┴──────────────────────────────────────────────────────┘
```

### Driver Delivery (Mobile)

```
┌─────────────────────────────┐
│ Area A · 12 customers       │
│ ████████░░ 8/12 delivered   │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Patel Tea Stall         │ │
│ │ Balance: 3 coolers      │ │
│ │ [-] 1 [+]  Given        │ │
│ │ [-] 1 [+]  Returned     │ │
│ │ [  MARK DELIVERED  ]    │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Next customer...        │ │
├─────────────────────────────┤
│ [Deliveries]    [History]   │  ← Bottom nav
└─────────────────────────────┘
```

### Customer Management

```
PageHeader [+ Add Customer]
[Search________________] [Area ▼] [Status ▼]
┌─────────────────────────────────────────────┐
│ Shop Name │ Area │ Phone │ Balance │ ... │ ▼│ ← sticky header
├─────────────────────────────────────────────┤
│ rows with pagination                        │
└─────────────────────────────────────────────┘
```

### Invoice (Print / A4)

```
┌─────────────────────────────────────────────┐
│ AQUA FLOW                    INV-2026-00001 │
│ Water Cooler Distribution    Date: 05 Jun    │
├─────────────────────────────────────────────┤
│ Bill To: Patel Tea Stall                    │
│ Period: 01 May – 31 May 2026                │
├─────────────────────────────────────────────┤
│ Date       │ Qty │ Rate  │ Amount           │
│ ...        │     │       │                  │
├─────────────────────────────────────────────┤
│ Total: ₹2,400          [QR]  Signature: ___ │
│ Status: PENDING                             │
└─────────────────────────────────────────────┘
```

---

## Interaction Guidelines

- **Hover:** Subtle background shift only (150ms)
- **Focus:** 2px ring `--brand-primary`
- **Toast:** Bottom-right, 3s auto-dismiss
- **No:** Parallax, glassmorphism, neon, heavy animation

## Accessibility

- Min touch target: 44×44px (drivers)
- Contrast ratio ≥ 4.5:1 body text
- All icons paired with labels
- Keyboard: Tab through forms, Enter to submit
