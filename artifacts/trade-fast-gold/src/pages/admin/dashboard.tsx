import React from 'react';
import { useGetAdminStats, useGetMe } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ArrowDownToLine, ArrowUpFromLine, Banknote, ShieldAlert, Ticket } from 'lucide-react';
import { Redirect } from 'wouter';

export default function AdminDashboard() {
  const { data: profile, isLoading: isProfileLoading } = useGetMe({ query: { enabled: true } });
  const isAdmin = profile?.role === 'admin';
  
  const { data: stats, isLoading: isStatsLoading } = useGetAdminStats({
    query: { enabled: isAdmin }
  });

  if (isProfileLoading) return null;
  if (!isAdmin) return <Redirect to="/dashboard" />;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  if (isStatsLoading || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-playfair font-bold text-white mb-6 text-primary">Admin Control Center</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-32 rounded-xl bg-white/5" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-primary tracking-wide flex items-center gap-3">
          <ShieldAlert className="h-8 w-8" /> Admin Control Center
        </h1>
        <p className="text-gray-400 mt-2">Platform-wide statistics and pending actions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#111111] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.activeUsers} active</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Deposits</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalDeposits)}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Withdrawals</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalWithdrawals)}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Active Investments</CardTitle>
            <Banknote className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalInvestments)}</div>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.totalProfit)} total profit generated</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-playfair font-bold text-white mt-8 mb-4">Pending Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={`bg-[#111111] ${stats.pendingDeposits > 0 ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-white/10'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Pending Deposits</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className={`text-4xl font-bold ${stats.pendingDeposits > 0 ? 'text-yellow-500' : 'text-white'}`}>
              {stats.pendingDeposits}
            </div>
            <a href="/admin/deposits" className="text-xs text-primary hover:underline">Review &rarr;</a>
          </CardContent>
        </Card>

        <Card className={`bg-[#111111] ${stats.pendingWithdrawals > 0 ? 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'border-white/10'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Pending Withdrawals</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className={`text-4xl font-bold ${stats.pendingWithdrawals > 0 ? 'text-orange-500' : 'text-white'}`}>
              {stats.pendingWithdrawals}
            </div>
            <a href="/admin/withdrawals" className="text-xs text-primary hover:underline">Review &rarr;</a>
          </CardContent>
        </Card>

        <Card className={`bg-[#111111] ${stats.pendingKyc > 0 ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-white/10'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Pending KYC</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className={`text-4xl font-bold ${stats.pendingKyc > 0 ? 'text-blue-500' : 'text-white'}`}>
              {stats.pendingKyc}
            </div>
            <a href="/admin/kyc" className="text-xs text-primary hover:underline">Review &rarr;</a>
          </CardContent>
        </Card>

        <Card className={`bg-[#111111] ${stats.openTickets > 0 ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'border-white/10'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className={`text-4xl font-bold ${stats.openTickets > 0 ? 'text-purple-500' : 'text-white'}`}>
              {stats.openTickets}
            </div>
            <a href="/admin/tickets" className="text-xs text-primary hover:underline">Review &rarr;</a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
