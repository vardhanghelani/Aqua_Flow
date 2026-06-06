import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Users,
  Truck,
  Package,
  ClipboardList,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Droplets,
  PanelLeftClose,
  PanelLeft,
  Boxes,
  IndianRupee,
  Wallet,
  Receipt,
  Calculator,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isBusinessUser } from '@/lib/auth-utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const ownerSections: NavSection[] = [
  {
    title: 'Home',
    items: [{ to: '/dashboard', label: 'Today', icon: LayoutDashboard }],
  },
  {
    title: 'Operations',
    items: [
      { to: '/deliveries', label: 'Deliveries', icon: Package },
      { to: '/collections', label: 'Collections', icon: Wallet },
      { to: '/settlements', label: 'Settlements', icon: Receipt },
    ],
  },
  {
    title: 'Customers',
    items: [
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/areas', label: 'Areas', icon: MapPin },
      { to: '/drivers', label: 'Drivers', icon: Truck },
      { to: '/assignments', label: 'Area Mappings', icon: ClipboardList },
    ],
  },
  {
    title: 'Finance',
    items: [
      { to: '/invoices', label: 'Invoices', icon: FileText },
      { to: '/payments', label: 'Payments', icon: IndianRupee },
      { to: '/expenses', label: 'Expenses', icon: Calculator },
    ],
  },
  {
    title: 'Reports',
    items: [
      { to: '/inventory', label: 'Inventory', icon: Boxes },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Settings',
    items: [{ to: '/settings', label: 'Configuration', icon: Settings }],
  },
];

const driverLinks: NavItem[] = [
  { to: '/driver/deliveries', label: 'Today', icon: ClipboardList },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const isOwner = isBusinessUser(user?.role);

  const renderLink = ({ to, label, icon: Icon }: NavItem) => (
    <NavLink
      key={to}
      to={to}
      onClick={onMobileClose}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn('erp-nav-item', collapsed && 'justify-center px-2', isActive && 'erp-nav-active')
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );

  const nav = (
    <>
      <div className={cn('flex items-center border-b px-4 py-4', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary">
          <Droplets className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold">Aqua Flow</h1>
            <p className="truncate text-xs text-muted-foreground">Daily Operations</p>
          </div>
        )}
        {!collapsed && (
          <Button variant="ghost" size="icon" onClick={onToggle} className="hidden lg:flex" aria-label="Collapse sidebar">
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {isOwner ? (
          ownerSections.map((section) => (
            <div key={section.title} className="mb-4">
              {!collapsed && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">{section.items.map(renderLink)}</div>
            </div>
          ))
        ) : (
          <div className="space-y-0.5">{driverLinks.map(renderLink)}</div>
        )}
      </nav>

      <div className="border-t p-3">
        {!collapsed && <p className="mb-2 truncate px-3 text-xs font-medium text-muted-foreground">{user?.name}</p>}
        <button onClick={logout} className={cn('erp-nav-item w-full text-left', collapsed && 'justify-center')}>
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onMobileClose} />}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-white transition-all duration-200 lg:static lg:z-auto',
          collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="absolute -right-3 top-5 z-10 hidden h-6 w-6 rounded-full border bg-white shadow-sm lg:flex"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-3 w-3" />
          </Button>
        )}
        {nav}
      </aside>
    </>
  );
}

