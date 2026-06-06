import { NavLink, useNavigate } from 'react-router-dom';
import { ClipboardList, History, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const links = [
  { to: '/driver/deliveries', label: 'Today', icon: ClipboardList },
  { to: '/driver/history', label: 'History', icon: History },
];

export function MobileBottomNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

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
        <button
          type="button"
          onClick={handleLogout}
          className="erp-touch-target flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
        >
          <LogOut className="h-6 w-6" />
          Logout
        </button>
      </div>
    </nav>
  );
}