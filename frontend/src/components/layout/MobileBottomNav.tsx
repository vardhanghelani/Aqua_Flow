import { NavLink } from 'react-router-dom';
import { ClipboardList, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/driver/deliveries', label: 'Today', icon: ClipboardList },
  { to: '/driver/history', label: 'History', icon: History },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5E7EB] bg-white lg:hidden">
      <div className="flex">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'erp-touch-target flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Icon className="h-6 w-6" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
