import React, { useState } from 'react';
import { useListAdminUsers, useUpdateAdminUser, useGetMe, useAdjustUserWallet } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Redirect } from 'wouter';
import { Search, Shield, UserX, UserCheck, Wallet, Loader2 } from 'lucide-react';
import { AdminUserUpdateRole, AdminWalletAdjustInputWalletType, AdminWalletAdjustInputDirection } from '@workspace/api-client-react/src/generated/api.schemas';
import { useQueryClient } from '@tanstack/react-query';
import { getListAdminUsersQueryKey } from '@workspace/api-client-react/src/generated/api';

const WALLET_TYPES: { value: AdminWalletAdjustInputWalletType; label: string }[] = [
  { value: 'main', label: 'Main Balance' },
  { value: 'profit', label: 'Profit' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'referral', label: 'Referral' },
];

export default function AdminUsers() {
  const { data: profile } = useGetMe({ query: { enabled: true } });
  const isAdmin = profile?.role === 'admin';
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: usersPage, isLoading } = useListAdminUsers({
    page,
    limit: 20,
    search: debouncedSearch || undefined
  }, { query: { enabled: isAdmin } });

  const updateUser = useUpdateAdminUser();
  const adjustWallet = useAdjustUserWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [walletDialogUser, setWalletDialogUser] = useState<{ id: number; name: string } | null>(null);
  const [walletType, setWalletType] = useState<AdminWalletAdjustInputWalletType>('main');
  const [direction, setDirection] = useState<AdminWalletAdjustInputDirection>('deposit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  if (!isAdmin && profile) return <Redirect to="/dashboard" />;

  const openWalletDialog = (userId: number, name: string) => {
    setWalletDialogUser({ id: userId, name });
    setWalletType('main');
    setDirection('deposit');
    setAmount('');
    setNote('');
  };

  const handleWalletSubmit = () => {
    if (!walletDialogUser) return;
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      toast({ variant: 'destructive', title: 'Enter a valid amount greater than zero' });
      return;
    }
    adjustWallet.mutate({
      id: walletDialogUser.id,
      data: { walletType, direction, amount: amountNum, note: note || undefined },
    }, {
      onSuccess: (result) => {
        toast({
          title: `${direction === 'deposit' ? 'Deposited' : 'Withdrew'} ${amountNum.toFixed(2)} ${direction === 'deposit' ? 'to' : 'from'} ${walletDialogUser.name}'s ${walletType} wallet`,
          description: `New balance: ${result.newBalance.toFixed(2)}`,
        });
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
        setWalletDialogUser(null);
      },
      onError: (err: any) => {
        toast({ variant: 'destructive', title: 'Wallet adjustment failed', description: err?.message ?? 'Something went wrong' });
      },
    });
  };

  const handleToggleStatus = (userId: number, currentStatus: boolean) => {
    updateUser.mutate({
      id: userId,
      data: { isActive: !currentStatus }
    }, {
      onSuccess: () => {
        toast({ title: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully` });
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
      }
    });
  };

  const handleToggleRole = (userId: number, currentRole: string) => {
    const newRole: AdminUserUpdateRole = currentRole === 'admin' ? 'user' : 'admin';
    updateUser.mutate({
      id: userId,
      data: { role: newRole }
    }, {
      onSuccess: () => {
        toast({ title: `User role changed to ${newRole}` });
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
      }
    });
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">Verified</Badge>;
      case 'pending': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20">Pending</Badge>;
      case 'rejected': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20">Rejected</Badge>;
      default: return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20">Unverified</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-playfair font-bold text-primary">User Management</h1>
        <p className="text-gray-400 text-sm mt-1">Manage platform users, roles, and access.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input 
            placeholder="Search email or name..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-[#111111] border-white/10 text-white"
          />
        </div>
      </div>

      <Card className="bg-[#111111] border-white/10">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5" />)}
            </div>
          ) : usersPage?.data && usersPage.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-primary">User</TableHead>
                    <TableHead className="text-primary">Role</TableHead>
                    <TableHead className="text-primary">KYC Status</TableHead>
                    <TableHead className="text-primary">Joined</TableHead>
                    <TableHead className="text-primary text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersPage.data.map((u) => (
                    <TableRow key={u.id} className={`border-white/10 hover:bg-white/5 ${!u.isActive ? 'opacity-50' : ''}`}>
                      <TableCell>
                        <p className="font-medium text-white">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded capitalize font-medium ${u.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-gray-300'}`}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell>{getKycBadge(u.kycStatus)}</TableCell>
                      <TableCell className="text-gray-400 text-sm">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openWalletDialog(u.id, `${u.firstName} ${u.lastName}`)}
                            className="h-8 border border-white/10 text-gray-300 hover:text-white"
                          >
                            <Wallet className="w-4 h-4 mr-1" />
                            Wallet
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleToggleRole(u.id, u.role)}
                            className="h-8 border border-white/10 text-gray-300 hover:text-white"
                          >
                            <Shield className="w-4 h-4 mr-1" />
                            {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                          </Button>
                          <Button 
                            variant={u.isActive ? "destructive" : "default"}
                            size="sm" 
                            onClick={() => handleToggleStatus(u.id, u.isActive ?? true)}
                            className={`h-8 ${!u.isActive ? 'bg-green-600 hover:bg-green-700' : ''}`}
                          >
                            {u.isActive ? <><UserX className="w-4 h-4 mr-1"/> Suspend</> : <><UserCheck className="w-4 h-4 mr-1"/> Activate</>}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {usersPage.total > 20 && (
                <div className="p-4 border-t border-white/10 flex justify-between items-center bg-black/20">
                  <p className="text-xs text-gray-500">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, usersPage.total)} of {usersPage.total}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= usersPage.total}>Next</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">No users found.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!walletDialogUser} onOpenChange={(open) => !open && setWalletDialogUser(null)}>
        <DialogContent className="bg-[#111111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="font-playfair text-primary">
              Manage Wallet — {walletDialogUser?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={direction === 'deposit' ? 'default' : 'outline'}
                className={direction === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'border-white/10 text-gray-300'}
                onClick={() => setDirection('deposit')}
              >
                Deposit
              </Button>
              <Button
                type="button"
                variant={direction === 'withdraw' ? 'default' : 'outline'}
                className={direction === 'withdraw' ? 'bg-red-600 hover:bg-red-700' : 'border-white/10 text-gray-300'}
                onClick={() => setDirection('withdraw')}
              >
                Withdraw
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Wallet</Label>
              <Select value={walletType} onValueChange={(v) => setWalletType(v as AdminWalletAdjustInputWalletType)}>
                <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WALLET_TYPES.map((w) => (
                    <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Amount (USD)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-[#0A0A0A] border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Note (optional)</Label>
              <Input
                placeholder="Reason for adjustment"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-[#0A0A0A] border-white/10 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-white/10 text-gray-300" onClick={() => setWalletDialogUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleWalletSubmit}
              disabled={adjustWallet.isPending}
              className={direction === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {adjustWallet.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Confirm {direction === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
