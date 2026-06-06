import { Bell, Search, Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SearchBar } from '@/components/data/SearchBar';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
interface TopNavbarProps {
  onMenuClick?: () => void;
  alertCount?: number;
  showSearch?: boolean;
}

export function TopNavbar({ onMenuClick, alertCount = 0, showSearch = true }: TopNavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const isDriver = user?.role === 'driver';

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value.trim().length >= 2) {
      navigate(`/customers?search=${encodeURIComponent(value.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-navbar items-center gap-4 border-b border-[#E5E7EB] bg-white px-4 lg:px-6">
      {onMenuClick && (
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden" aria-label="Toggle menu">
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {isDriver ? (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#111827]">{user?.name}</p>
          <p className="text-xs text-muted-foreground">Today&apos;s route</p>
        </div>
      ) : (
        showSearch && (
          <div className="hidden flex-1 md:block md:max-w-md">
            <SearchBar value={search} onChange={handleSearch} placeholder="Search customers..." />
          </div>
        )
      )}

      <div className="ml-auto flex items-center gap-2">
        {!isDriver && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Search customers"
            onClick={() => navigate('/customers')}
          >
            <Search className="h-5 w-5" />
          </Button>
        )}

        {!isDriver && (
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications" onClick={() => navigate('/dashboard')}>
            <Bell className="h-5 w-5" />
            {alertCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </Button>
        )}

        {!isDriver && (
          <div className="hidden items-center gap-2 border-l pl-4 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
            </div>
          </div>
        )}

        {isDriver && (
          <Button
            variant="ghost"
            size="sm"
            className="hidden shrink-0 gap-1.5 text-muted-foreground hover:text-destructive sm:inline-flex"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        )}
      </div>
    </header>
  );
}

