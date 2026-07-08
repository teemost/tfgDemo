import React from 'react';
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Route, Switch, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from './lib/queryClient';

// Pages
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
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
import AdminDashboard from '@/pages/admin/dashboard';
import AdminUsers from '@/pages/admin/users';
import AdminDeposits from '@/pages/admin/deposits';
import AdminWithdrawals from '@/pages/admin/withdrawals';
import AdminKyc from '@/pages/admin/kyc';
import AdminTickets from '@/pages/admin/tickets';

// Layout
import AppLayout from '@/components/layout/Layout';
import { useEnsureUser } from '@workspace/api-client-react';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#D4AF37',
    colorForeground: '#F2F2F2',
    colorMutedForeground: '#999999',
    colorDanger: '#ef4444',
    colorBackground: '#0A0A0A',
    colorInput: '#1A1A1A',
    colorInputForeground: '#F2F2F2',
    colorNeutral: '#333333',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '0.5rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#111111] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#D4AF37]/20',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-white font-playfair text-2xl',
    headerSubtitle: 'text-gray-400',
    socialButtonsBlockButtonText: 'text-white',
    formFieldLabel: 'text-gray-300',
    footerActionLink: 'text-[#D4AF37] hover:text-[#F4C842]',
    footerActionText: 'text-gray-400',
    dividerText: 'text-gray-500',
    identityPreviewEditButton: 'text-[#D4AF37]',
    formFieldSuccessText: 'text-green-500',
    alertText: 'text-red-400',
    formButtonPrimary: 'bg-gold-gradient text-black hover:opacity-90',
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function AuthGuard() {
  const ensureUser = useEnsureUser();
  const { user } = useUser();
  
  React.useEffect(() => {
    if (user) {
      ensureUser.mutate();
    }
  }, [user?.id]);
  
  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>
          <Component />
        </AppLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = React.useRef<string | null | undefined>(undefined);

  React.useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AuthGuard />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
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
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
