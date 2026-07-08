import React from 'react';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from './lib/queryClient';
import { useSession } from '@/hooks/use-session';

// Pages
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import Login from '@/pages/login';
import Register from '@/pages/register';
import Dashboard from '@/pages/dashboard';
import Plans from '@/pages/plans';
import Deposit from '@/pages/deposit';
import Withdraw from '@/pages/withdraw';
import Investments from '@/pages/investments';
import Wallet from '@/pages/wallet';
import Transactions from '@/pages/transactions';
import Kyc from '@/pages/kyc';
import Referrals from '@/pages/referrals';
import Notifications from '@/pages/notifications';
import Market from '@/pages/market';
import Support from '@/pages/support';
import SupportTicket from '@/pages/support-ticket';
import Profile from '@/pages/profile';

// Admin Pages
import AdminLogin from '@/pages/admin/login';
import AdminRegister from '@/pages/admin/register';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminUsers from '@/pages/admin/users';
import AdminDeposits from '@/pages/admin/deposits';
import AdminWithdrawals from '@/pages/admin/withdrawals';
import AdminKyc from '@/pages/admin/kyc';
import AdminTickets from '@/pages/admin/tickets';

// Layout
import AppLayout from '@/components/layout/Layout';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function HomeRedirect() {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return null;
  }

  return isAuthenticated ? <Redirect to="/dashboard" /> : <Home />;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function AppRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/register" component={AdminRegister} />

          <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
          <Route path="/plans"><ProtectedRoute component={Plans} /></Route>
          <Route path="/deposit"><ProtectedRoute component={Deposit} /></Route>
          <Route path="/withdraw"><ProtectedRoute component={Withdraw} /></Route>
          <Route path="/investments"><ProtectedRoute component={Investments} /></Route>
          <Route path="/wallet"><ProtectedRoute component={Wallet} /></Route>
          <Route path="/transactions"><ProtectedRoute component={Transactions} /></Route>
          <Route path="/kyc"><ProtectedRoute component={Kyc} /></Route>
          <Route path="/referrals"><ProtectedRoute component={Referrals} /></Route>
          <Route path="/notifications"><ProtectedRoute component={Notifications} /></Route>
          <Route path="/market"><ProtectedRoute component={Market} /></Route>
          <Route path="/support"><ProtectedRoute component={Support} /></Route>
          <Route path="/support/:id"><ProtectedRoute component={SupportTicket} /></Route>
          <Route path="/profile"><ProtectedRoute component={Profile} /></Route>

          <Route path="/admin"><ProtectedRoute component={AdminDashboard} /></Route>
          <Route path="/admin/users"><ProtectedRoute component={AdminUsers} /></Route>
          <Route path="/admin/deposits"><ProtectedRoute component={AdminDeposits} /></Route>
          <Route path="/admin/withdrawals"><ProtectedRoute component={AdminWithdrawals} /></Route>
          <Route path="/admin/kyc"><ProtectedRoute component={AdminKyc} /></Route>
          <Route path="/admin/tickets"><ProtectedRoute component={AdminTickets} /></Route>

          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}

export default App;
