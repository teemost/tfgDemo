import React from 'react';
import { Link, useLocation } from 'wouter';
import { useUser, useClerk } from '@clerk/react';
import { useGetMe } from '@workspace/api-client-react';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  ShieldCheck,
  Users,
  Bell,
  HelpCircle,
  Settings,
  LogOut,
  LineChart,
  UserCog,
  FileCheck,
  Banknote,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isLoaded: isClerkLoaded } = useUser();
  const { signOut } = useClerk();
  
  const { data: profile } = useGetMe({
    query: {
      enabled: isClerkLoaded && !!user?.id
    }
  });

  const isAdmin = profile?.role === 'admin';
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

  const mainNav = [
    { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { title: 'Live Market', path: '/market', icon: LineChart },
  ];

  const investNav = [
    { title: 'Investment Plans', path: '/plans', icon: TrendingUp },
    { title: 'My Investments', path: '/investments', icon: Banknote },
    { title: 'Wallet', path: '/wallet', icon: Wallet },
  ];

  const financeNav = [
    { title: 'Deposit', path: '/deposit', icon: ArrowDownToLine },
    { title: 'Withdraw', path: '/withdraw', icon: ArrowUpFromLine },
    { title: 'Transactions', path: '/transactions', icon: History },
  ];

  const accountNav = [
    { title: 'Profile', path: '/profile', icon: Settings },
    { title: 'KYC Verification', path: '/kyc', icon: ShieldCheck },
    { title: 'Referrals', path: '/referrals', icon: Users },
    { title: 'Notifications', path: '/notifications', icon: Bell },
    { title: 'Support', path: '/support', icon: HelpCircle },
  ];

  const adminNav = [
    { title: 'Overview', path: '/admin', icon: LayoutDashboard },
    { title: 'Users', path: '/admin/users', icon: UserCog },
    { title: 'Deposits', path: '/admin/deposits', icon: ArrowDownToLine },
    { title: 'Withdrawals', path: '/admin/withdrawals', icon: ArrowUpFromLine },
    { title: 'KYC Requests', path: '/admin/kyc', icon: FileCheck },
    { title: 'Support Tickets', path: '/admin/tickets', icon: Ticket },
  ];

  const renderMenu = (items: typeof mainNav) => (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = location === item.path || location.startsWith(`${item.path}/`);
        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
              <Link href={item.path} className={`flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary border-l-2 border-primary rounded-l-none' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" className="border-r border-border/50 bg-[#0A0A0A]">
        <SidebarHeader className="h-16 flex items-center px-4 border-b border-border/50">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center">
              <span className="text-black font-playfair font-bold text-sm">TFG</span>
            </div>
            <span className="font-playfair font-semibold text-white tracking-wider">TRADE FAST GOLD</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              {renderMenu(mainNav)}
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Invest</SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenu(investNav)}
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Finance</SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenu(financeNav)}
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Account</SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenu(accountNav)}
            </SidebarGroupContent>
          </SidebarGroup>

          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                {renderMenu(adminNav)}
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
        <SidebarFooter className="border-t border-border/50 p-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-9 w-9 border border-primary/20">
              <AvatarImage src={profile?.avatarUrl || user?.imageUrl} />
              <AvatarFallback className="bg-primary/10 text-primary">{profile?.firstName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{profile?.firstName} {profile?.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5"
            onClick={() => signOut({ redirectUrl: basePath || '/' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-[#0A0A0A] flex flex-col min-h-screen">
        <header className="h-16 flex items-center px-4 border-b border-border/50 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-10">
          <SidebarTrigger className="text-gray-400 hover:text-white mr-4" />
          <div className="flex-1" />
          {profile?.kycStatus === 'pending' && (
            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-medium rounded-full border border-yellow-500/20 mr-4">
              KYC Pending
            </span>
          )}
          {profile?.kycStatus === 'approved' && (
            <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full border border-green-500/20 mr-4">
              Verified
            </span>
          )}
        </header>
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
