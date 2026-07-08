import React from 'react';
import { useGetDashboardSummary, useGetMe } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@clerk/react';
import { Wallet, TrendingUp, ArrowDownToLine, ArrowUpFromLine, Activity, History } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Dummy data for chart since we don't have historical chart endpoint
const chartData = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 5000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 6890 },
  { name: 'Sat', value: 8390 },
  { name: 'Sun', value: 10490 },
];

export default function Dashboard() {
  const { isLoaded, user } = useUser();
  const { data: profile } = useGetMe({ query: { enabled: isLoaded && !!user?.id } });
  const { data: summary, isLoading } = useGetDashboardSummary({ 
    query: { enabled: isLoaded && !!user?.id } 
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-playfair font-bold text-white mb-6">Dashboard Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl bg-white/5" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl bg-white/5" />
          <Skeleton className="h-96 rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-white tracking-wide">
            Welcome back, {profile?.firstName}
          </h1>
          <p className="text-gray-400 mt-1">Here's what's happening with your investments today.</p>
        </div>
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Portfolio</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(summary.portfolioValue)}</div>
            <p className="text-xs text-green-400 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" /> +2.5% this week
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Available Balance</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowDownToLine className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(summary.availableBalance)}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Profit</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(summary.totalProfit)}</div>
            <p className="text-xs text-gray-400 mt-1">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Investments</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{summary.activeInvestments}</div>
            <p className="text-xs text-gray-400 mt-1">Running plans</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-playfair text-xl">Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{fill: '#666'}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#666'}} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#D4AF37' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={3} dot={{ r: 4, fill: '#111', stroke: '#D4AF37', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#D4AF37' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card flex flex-col">
          <CardHeader>
            <CardTitle className="font-playfair text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {summary.recentTransactions && summary.recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {summary.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' :
                        tx.type === 'withdrawal' ? 'bg-red-500/10 text-red-500' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {tx.type === 'deposit' ? <ArrowDownToLine size={14} /> :
                         tx.type === 'withdrawal' ? <ArrowUpFromLine size={14} /> :
                         <TrendingUp size={14} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white capitalize">{tx.type}</p>
                        <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        tx.type === 'deposit' ? 'text-green-400' :
                        tx.type === 'withdrawal' ? 'text-white' :
                        'text-primary'
                      }`}>
                        {tx.type === 'withdrawal' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 pb-10">
                <History className="h-10 w-10 mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
