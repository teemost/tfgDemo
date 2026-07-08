import React, { useState } from 'react';
import { useListAdminDeposits, useApproveDeposit, useRejectDeposit, useGetMe } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Redirect } from 'wouter';
import { Check, X, ExternalLink } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListAdminDepositsQueryKey } from '@workspace/api-client-react/src/generated/api';

export default function AdminDeposits() {
  const { data: profile } = useGetMe({ query: { enabled: true } });
  const isAdmin = profile?.role === 'admin';
  
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('pending');
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const { data: depositsPage, isLoading } = useListAdminDeposits({
    page,
    status: status !== 'all' ? status : undefined
  }, { query: { enabled: isAdmin } });

  const approveDeposit = useApproveDeposit();
  const rejectDeposit = useRejectDeposit();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!isAdmin && profile) return <Redirect to="/dashboard" />;

  const handleApprove = (id: number) => {
    if (confirm("Are you sure you want to approve this deposit? Funds will be added to the user's main wallet.")) {
      approveDeposit.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Deposit approved successfully" });
          queryClient.invalidateQueries({ queryKey: getListAdminDepositsQueryKey() });
        }
      });
    }
  };

  const handleReject = () => {
    if (!rejectId || !rejectReason) return;
    rejectDeposit.mutate({ 
      id: rejectId, 
      data: { reason: rejectReason } 
    }, {
      onSuccess: () => {
        toast({ title: "Deposit rejected" });
        setRejectId(null);
        setRejectReason('');
        queryClient.invalidateQueries({ queryKey: getListAdminDepositsQueryKey() });
      }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-playfair font-bold text-primary">Deposit Requests</h1>
          <p className="text-gray-400 text-sm mt-1">Review and process user deposits.</p>
        </div>
        
        <div className="w-48">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="bg-[#111111] border-white/10 text-white">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent className="bg-[#111111] border-white/10 text-white">
              <SelectItem value="pending">Pending Only</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All Deposits</SelectItem>
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
          ) : depositsPage?.data && depositsPage.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-primary">ID/Ref</TableHead>
                    <TableHead className="text-primary">User ID</TableHead>
                    <TableHead className="text-primary">Method</TableHead>
                    <TableHead className="text-primary">Amount</TableHead>
                    <TableHead className="text-primary">TxHash / Details</TableHead>
                    <TableHead className="text-primary">Date</TableHead>
                    <TableHead className="text-primary text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {depositsPage.data.map((d) => (
                    <TableRow key={d.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-mono text-xs text-gray-400">{d.reference}</TableCell>
                      <TableCell className="text-sm">User #{d.userId}</TableCell>
                      <TableCell className="uppercase text-xs tracking-wider">{d.method.replace('_', ' ')}</TableCell>
                      <TableCell className="font-bold text-white">{formatCurrency(d.amount)}</TableCell>
                      <TableCell>
                        {d.transactionHash ? (
                          <div className="flex items-center gap-1 font-mono text-xs text-primary max-w-[150px] truncate" title={d.transactionHash}>
                            {d.transactionHash}
                          </div>
                        ) : <span className="text-xs text-gray-500">None provided</span>}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">{new Date(d.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {d.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(d.id)} disabled={approveDeposit.isPending}>
                              <Check className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8" onClick={() => setRejectId(d.id)}>
                              <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded uppercase font-bold tracking-wider ${d.status === 'confirmed' ? 'text-green-500' : 'text-red-500'}`}>
                            {d.status}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">No deposits found.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent className="bg-[#111111] border-red-500/20 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">Reject Deposit</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm text-gray-300 mb-2 block">Reason for rejection (sent to user)</label>
            <Input 
              value={rejectReason} 
              onChange={(e) => setRejectReason(e.target.value)} 
              placeholder="e.g. Invalid transaction hash, Funds not received"
              className="bg-[#0A0A0A] border-white/10 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectId(null)} className="text-gray-400 hover:text-white">Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || rejectDeposit.isPending}>Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
