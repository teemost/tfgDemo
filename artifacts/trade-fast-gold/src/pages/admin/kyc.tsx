import React, { useState } from 'react';
import { useListAdminKyc, useApproveKyc, useRejectKyc, useGetMe } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Redirect } from 'wouter';
import { Check, X, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListAdminKycQueryKey } from '@workspace/api-client-react/src/generated/api';

export default function AdminKyc() {
  const { data: profile } = useGetMe({ query: { enabled: true } });
  const isAdmin = profile?.role === 'admin';
  
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('pending');
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewDocs, setViewDocs] = useState<any>(null);
  
  const { data: kycPage, isLoading } = useListAdminKyc({
    page,
    status: status !== 'all' ? status : undefined
  }, { query: { enabled: isAdmin } });

  const approveKyc = useApproveKyc();
  const rejectKyc = useRejectKyc();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!isAdmin && profile) return <Redirect to="/dashboard" />;

  const handleApprove = (id: number) => {
    approveKyc.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "KYC approved. User is now fully verified." });
        queryClient.invalidateQueries({ queryKey: getListAdminKycQueryKey() });
        setViewDocs(null);
      }
    });
  };

  const handleReject = () => {
    if (!rejectId || !rejectReason) return;
    rejectKyc.mutate({ 
      id: rejectId, 
      data: { reason: rejectReason } 
    }, {
      onSuccess: () => {
        toast({ title: "KYC rejected. User must resubmit." });
        setRejectId(null);
        setRejectReason('');
        queryClient.invalidateQueries({ queryKey: getListAdminKycQueryKey() });
        setViewDocs(null);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-playfair font-bold text-primary">KYC Review</h1>
          <p className="text-gray-400 text-sm mt-1">Verify user identities to comply with regulations.</p>
        </div>
        
        <div className="w-48">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="bg-[#111111] border-white/10 text-white">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent className="bg-[#111111] border-white/10 text-white">
              <SelectItem value="pending">Pending Only</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All Records</SelectItem>
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
          ) : kycPage?.data && kycPage.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-primary w-16">ID</TableHead>
                    <TableHead className="text-primary">User ID</TableHead>
                    <TableHead className="text-primary">Document Type</TableHead>
                    <TableHead className="text-primary">Submitted</TableHead>
                    <TableHead className="text-primary text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kycPage.data.map((k) => (
                    <TableRow key={k.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-mono text-xs text-gray-500">#{k.id}</TableCell>
                      <TableCell className="text-sm">User #{k.userId}</TableCell>
                      <TableCell className="uppercase text-xs tracking-wider">{k.documentType?.replace('_', ' ')}</TableCell>
                      <TableCell className="text-gray-400 text-sm">{new Date(k.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {k.status === 'pending' ? (
                          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setViewDocs(k)}>
                            <ImageIcon className="w-4 h-4 mr-1" /> Review Docs
                          </Button>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded uppercase font-bold tracking-wider ${k.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>
                            {k.status}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">No KYC records found.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewDocs} onOpenChange={(open) => !open && setViewDocs(null)}>
        <DialogContent className="bg-[#111111] border-primary/20 text-white sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl text-primary">Review Documents for User #{viewDocs?.userId}</DialogTitle>
          </DialogHeader>
          
          {viewDocs && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300">Front of Document ({viewDocs.documentType})</h4>
                  <div className="border border-white/10 rounded-lg p-2 bg-black/50 aspect-video flex items-center justify-center overflow-hidden">
                    {viewDocs.documentFrontUrl ? (
                      <a href={viewDocs.documentFrontUrl} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center">
                        <img src={viewDocs.documentFrontUrl} alt="Front" className="max-w-full max-h-full object-contain" />
                      </a>
                    ) : <span className="text-gray-600 text-sm">Not provided</span>}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300">Back of Document</h4>
                  <div className="border border-white/10 rounded-lg p-2 bg-black/50 aspect-video flex items-center justify-center overflow-hidden">
                    {viewDocs.documentBackUrl ? (
                      <a href={viewDocs.documentBackUrl} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center">
                        <img src={viewDocs.documentBackUrl} alt="Back" className="max-w-full max-h-full object-contain" />
                      </a>
                    ) : <span className="text-gray-600 text-sm">Not provided</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300">Selfie with Document</h4>
                  <div className="border border-white/10 rounded-lg p-2 bg-black/50 aspect-square flex items-center justify-center overflow-hidden">
                    {viewDocs.selfieUrl ? (
                      <a href={viewDocs.selfieUrl} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center">
                        <img src={viewDocs.selfieUrl} alt="Selfie" className="max-w-full max-h-full object-contain" />
                      </a>
                    ) : <span className="text-gray-600 text-sm">Not provided</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300">Proof of Address</h4>
                  <div className="border border-white/10 rounded-lg p-2 bg-black/50 aspect-square flex items-center justify-center overflow-hidden">
                    {viewDocs.proofOfAddressUrl ? (
                      <a href={viewDocs.proofOfAddressUrl} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center">
                        <img src={viewDocs.proofOfAddressUrl} alt="POA" className="max-w-full max-h-full object-contain" />
                      </a>
                    ) : <span className="text-gray-600 text-sm">Not provided</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button variant="destructive" onClick={() => setRejectId(viewDocs.id)} disabled={approveKyc.isPending}>
                  <X className="w-4 h-4 mr-2" /> Reject
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(viewDocs.id)} disabled={approveKyc.isPending}>
                  <Check className="w-4 h-4 mr-2" /> Approve Verification
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent className="bg-[#111111] border-red-500/20 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">Reject KYC</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm text-gray-300 mb-2 block">Reason for rejection (sent to user)</label>
            <Input 
              value={rejectReason} 
              onChange={(e) => setRejectReason(e.target.value)} 
              placeholder="e.g. Blurry ID, Expired document, Name mismatch"
              className="bg-[#0A0A0A] border-white/10 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectId(null)} className="text-gray-400 hover:text-white">Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || rejectKyc.isPending}>Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
