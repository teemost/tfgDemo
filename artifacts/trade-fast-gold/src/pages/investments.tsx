import React from 'react';
import { useListInvestments } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Activity, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from 'react-day-picker';

export default function Investments() {
  const { data: investments, isLoading } = useListInvestments();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-primary/10 text-primary border-primary/20';
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-playfair font-bold text-white mb-6">My Investments</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full bg-white/5" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-white tracking-wide">My Investments</h1>
        <p className="text-gray-400 mt-2">Track the performance and progress of your active portfolios.</p>
      </div>

      {investments && investments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {investments.map((inv) => (
            <Card key={inv.id} className="glass-card overflow-hidden">
              <div className={`h-1 w-full ${inv.status === 'active' ? 'bg-primary' : inv.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`} />
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {inv.status === 'active' ? <Activity className="text-primary h-6 w-6" /> : 
                       inv.status === 'completed' ? <CheckCircle2 className="text-green-500 h-6 w-6" /> : 
                       <XCircle className="text-red-500 h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-playfair font-bold text-white tracking-wider">{inv.planName}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {inv.durationDays} Days</span>
                        <span className="uppercase text-xs font-semibold px-2 py-0.5 rounded-full border bg-white/5 border-white/10">ID: INV-{inv.id}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 md:text-right">
                    <div>
                      <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Invested</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(inv.amount)}</p>
                    </div>
                    <div className="w-px bg-white/10"></div>
                    <div>
                      <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Earned Profit</p>
                      <p className="text-xl font-bold text-primary">+{formatCurrency(inv.profitEarned)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Progress</span>
                    <span className="text-white font-medium">{inv.progressPercent}%</span>
                  </div>
                  <Progress value={inv.progressPercent} className="h-2 bg-white/5" />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Started: {new Date(inv.startDate).toLocaleDateString()}</span>
                    <span>Ends: {new Date(inv.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <Badge variant="outline" className={getStatusColor(inv.status)}>
                    {inv.status.toUpperCase()}
                  </Badge>
                  <div className="text-sm text-gray-300">
                    Expected ROI: <span className="text-primary font-bold">{inv.roiPercent}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-playfair font-bold text-white mb-2">No Active Investments</h3>
            <p className="text-gray-400 max-w-sm mb-6">You don't have any investments running at the moment. Browse our plans to get started.</p>
            <Button asChild className="bg-gold-gradient text-black font-semibold">
              <a href="/plans">View Investment Plans</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
