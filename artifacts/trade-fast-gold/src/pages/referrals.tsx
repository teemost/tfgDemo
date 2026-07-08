import React from 'react';
import { useGetReferralStats, useListReferrals } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Link as LinkIcon, Gift, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Referrals() {
  const { data: stats, isLoading: statsLoading } = useGetReferralStats();
  const { data: referrals, isLoading: referralsLoading } = useListReferrals();
  const { toast } = useToast();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const copyLink = () => {
    if (stats?.referralLink) {
      navigator.clipboard.writeText(stats.referralLink);
      toast({ title: "Referral Link Copied!", duration: 2000 });
    }
  };

  const copyCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      toast({ title: "Referral Code Copied!", duration: 2000 });
    }
  };

  if (statsLoading || referralsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-playfair font-bold text-white mb-6">Referral Program</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 bg-white/5 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-white tracking-wide">Referral Program</h1>
        <p className="text-gray-400 mt-2 max-w-2xl">Invite friends and earn a percentage of their investments automatically.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{stats?.totalReferrals || 0}</div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{stats?.activeReferrals || 0} active</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-primary font-mono">{formatCurrency(stats?.totalEarnings || 0)}</div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Gift className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Added to Referral Wallet</p>
          </CardContent>
        </Card>

        <Card className="glass-card bg-gold-gradient relative overflow-hidden text-black border-none">
          <div className="absolute -right-4 -bottom-4 opacity-20">
            <LinkIcon size={120} />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-bold opacity-80 uppercase tracking-widest text-black">Your Invite Code</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold font-mono tracking-widest">{stats?.referralCode || '------'}</div>
              <Button variant="ghost" size="icon" onClick={copyCode} className="hover:bg-black/10 text-black rounded-full">
                <Copy className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-playfair">Share Your Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              readOnly 
              value={stats?.referralLink || ''} 
              className="bg-[#0A0A0A] border-white/10 text-gray-300 font-mono"
            />
            <Button onClick={copyLink} className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50 shrink-0">
              <Copy className="h-4 w-4 mr-2" /> Copy Link
            </Button>
          </div>
          <p className="text-sm text-gray-400 mt-4 leading-relaxed">
            When someone registers using your link and makes an investment, you instantly receive a 5% commission on their first deposit directly to your Referral Wallet.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-playfair">Your Network</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals && referrals.length > 0 ? (
            <div className="rounded-md border border-white/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-primary">Name</TableHead>
                    <TableHead className="text-primary">Email</TableHead>
                    <TableHead className="text-primary">Joined</TableHead>
                    <TableHead className="text-primary">Commission Earned</TableHead>
                    <TableHead className="text-primary text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((ref) => (
                    <TableRow key={ref.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{ref.referredName}</TableCell>
                      <TableCell className="text-gray-400">{ref.referredEmail.replace(/(.{2})(.*)(?=@)/, '$1***')}</TableCell>
                      <TableCell className="text-gray-400">{new Date(ref.joinedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-primary font-medium">{formatCurrency(ref.commission)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          {ref.status === 'invested' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20"><CheckCircle2 className="w-3 h-3"/> Active</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">Registered</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>You haven't referred anyone yet. Share your link to start earning!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
