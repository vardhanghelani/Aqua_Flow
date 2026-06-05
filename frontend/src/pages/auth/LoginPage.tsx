import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const stored = localStorage.getItem('token');
      if (stored) {
        const payload = JSON.parse(atob(stored.split('.')[1]));
        navigate(payload.role === 'driver' ? '/driver/deliveries' : '/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand (desktop only) */}
      <div className="hidden w-1/2 flex-col justify-between border-r bg-card p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Droplets className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Aqua Flow</h1>
            <p className="text-sm text-muted-foreground">Distribution Management ERP</p>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            Manage deliveries,<br />inventory & billing<br />in one place.
          </h2>
          <p className="mt-4 max-w-sm text-muted-foreground">
            Built for water cooler distribution businesses. Track daily deliveries, cooler exchange, and generate invoices automatically.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Daily delivery tracking per customer</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-secondary" />Automatic billing from delivery records</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-success" />Real-time inventory reconciliation</li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">© 2026 Aqua Flow. All rights reserved.</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-6">
        <div className="mb-8 flex w-full max-w-sm items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Droplets className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Aqua Flow</span>
          </div>
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === 'light' ? 'Dark' : 'Light'}
          </Button>
        </div>

        <Card className="w-full max-w-sm border shadow-card">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="owner@aquaflow.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {import.meta.env.VITE_DEMO_MODE === 'true' && (
              <div className="mt-6 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Demo accounts</p>
                <p className="mt-1">Owner: owner@aquaflow.com / admin123</p>
                <p>Driver: driver1@aquaflow.com / driver123</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
