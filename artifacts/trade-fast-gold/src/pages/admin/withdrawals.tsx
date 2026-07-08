import React, { useState } from 'react';
import { useListAdminWithdrawals, useApproveWithdrawal, useDeclineWithdrawal, useGetMe } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Redirect } from 'wouter';
import { Check, X, Copy } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListAdminWithdrawalsQueryKey } from '@workspace/api-client-react/src/generated/api';

export default function AdminWithdrawals() {
  const { data: profile } = useGetMe({ query: { enabled: true } });
  const isAdmin = profile?.role === 'admin';
  
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('pending');
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  
  const { data: withdrawalsPage, isLoading } = useListAdminWithdrawals({
    page,
    status: status !== 'all' ? status : undefined
  }, { query: { enabled: isAdmin } });

  const approveWithdrawal = useApproveWithdrawal();
  const declineWithdrawal = useDeclineWithdrawal();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!isAdmin && profile) return <Redirect to="/dashboard" />;

  const handleApprove = (id: number) => {
    if (confirm("Are you sure? Approving this marks it as paid. Ensure you have actually sent the funds to the user.")) {
      approveWithdrawal.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Withdrawal approved successfully" });
          queryClient.invalidateQueries({ queryKey: getListAdminWithdrawalsQueryKey() });
        }
      });
    }
  };

  const handleDecline = () => {
    if (!declineId || !declineReason) return;
    declineWithdrawal.mutate({ 
      id: declineId, 
      data: { reason: declineReason } 
    }, {
      onSuccess: () => {
        toast({ title: "Withdrawal declined. Funds returned to user wallet." });
        setDeclineId(null);
        setDeclineReason('');
        queryClient.invalidateQueries({ queryKey: getListAdminWithdrawalsQueryKey() });
      }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard", duration: 2000 });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-playfair font-bold text-primary">Withdrawal Requests</h1>
          <p className="text-gray-400 text-sm mt-1">Process user payouts.</p>
        </div>
        
        <div className="w-48">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="bg-[#111111] border-white/10 text-white">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent className="bg-[#111111] border-white/10 text-white">
              <SelectItem value="pending">Pending Only</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="all">All Withdrawals</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-[#111111] border-white/10">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5" />)}
            </div>
          ) : withdrawalsPage?.data && withdrawalsPage.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-primary w-16">ID</TableHead>
                    <TableHead className="text-primary">User ID</TableHead>
                    <TableHead className="text-primary">Method</TableHead>
                    <TableHead className="text-primary">Amount</TableHead>
                    <TableHead className="text-primary">Destination Details</TableHead>
                    <TableHead className="text-primary">Date</TableHead>
                    <TableHead className="text-primary text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawalsPage.data.map((w) => (
                    <TableRow key={w.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-mono text-xs text-gray-500">#{w.id}</TableCell>
                      <TableCell className="text-sm">User #{w.userId}</TableCell>
                      <TableCell className="uppercase text-xs tracking-wider">{w.method.replace('_', ' ')}</TableCell>
                      <TableCell className="font-bold text-white">{formatCurrency(w.amount)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 max-w-[250px]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-primary truncate" title={w.walletAddress}>{w.walletAddress}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-white/10" onClick={() => copyText(w.walletAddress)}>
                              <Copy size={12} className="text-gray-400" />
                            </Button>
                          </div>
                          {w.bankDetails && <span className="text-xs text-gray-400 truncate" title={w.bankDetails}>{w.bankDetails}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">{new Date(w.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {w.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(w.id)} disabled={approveWithdrawal.isPending}>
                              <Check className="w-4 h-4 mr-1" /> Mark Paid
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8" onClick={() => setDeclineId(w.id)}>
                              <X className="w-4 h-4 mr-1" /> Decline
                            </Button>
                          </div>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded uppercase font-bold tracking-wider ${w.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>
                            {w.status}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">No withdrawals found.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!declineId} onOpenChange={(open) => !open && setDeclineId(null)}>
        <DialogContent className="bg-[#111111] border-red-500/20 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">Decline Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-400">Declining will return the funds to the user's main wallet.</p>
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Reason for declining (sent to user)</label>
              <Input 
                value={declineReason} 
                onChange={(e) => setDeclineReason(e.target.value)} 
                placeholder="e.g. Invalid wallet address, KYC required"
                className="bg-[#0A0A0A] border-white/10 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeclineId(null)} className="text-gray-400 hover:text-white">Cancel</Button>
            <Button variant="destructive" onClick={handleDecline} disabled={!declineReason || declineWithdrawal.isPending}>Confirm Decline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
