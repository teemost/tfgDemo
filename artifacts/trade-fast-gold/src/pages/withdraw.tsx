import React from 'react';
import { useListWithdrawals, useCreateWithdrawal, useListWallets } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { WithdrawalInputMethod } from '@workspace/api-client-react/src/generated/api.schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const withdrawSchema = z.object({
  amount: z.coerce.number().min(50, 'Minimum withdrawal is $50'),
  method: z.enum(['bank_account', 'crypto_wallet'] as const),
  walletAddress: z.string().min(5, 'Address is required'),
  bankDetails: z.string().optional(),
});

export default function Withdraw() {
  const { data: withdrawals, isLoading, refetch } = useListWithdrawals();
  const { data: wallets } = useListWallets();
  const createWithdrawal = useCreateWithdrawal();
  const { toast } = useToast();

  const mainWallet = wallets?.find(w => w.type === 'main');
  const availableBalance = mainWallet?.balance || 0;

  const form = useForm<z.infer<typeof withdrawSchema>>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: 0,
      method: 'crypto_wallet',
      walletAddress: '',
      bankDetails: '',
    },
  });

  const watchMethod = form.watch('method');

  const onSubmit = (values: z.infer<typeof withdrawSchema>) => {
    if (values.amount > availableBalance) {
      form.setError('amount', { message: 'Insufficient balance' });
      return;
    }

    createWithdrawal.mutate({
      data: {
        amount: values.amount,
        method: values.method as WithdrawalInputMethod,
        walletAddress: values.walletAddress,
        bankDetails: values.bankDetails,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Withdrawal Requested",
          description: "Your withdrawal has been queued for processing.",
        });
        form.reset();
        refetch();
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Request Failed",
          description: error.message || "An error occurred while requesting withdrawal.",
        });
      }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-white tracking-wide">Withdraw Funds</h1>
        <p className="text-gray-400 mt-2 max-w-2xl">Transfer funds from your main wallet to your external accounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-playfair flex justify-between items-center">
                <span>New Request</span>
                <span className="text-sm font-sans font-normal text-primary">Bal: {formatCurrency(availableBalance)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Amount (USD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500">$</span>
                            <Input type="number" placeholder="0.00" className="pl-8 bg-[#0A0A0A] border-white/10 text-white" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Withdrawal Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white">
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#111111] border-white/10 text-white">
                            <SelectItem value="crypto_wallet">Crypto Wallet (BTC/ETH/USDT)</SelectItem>
                            <SelectItem value="bank_account">Bank Wire Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchMethod === 'crypto_wallet' ? (
                    <FormField
                      control={form.control}
                      name="walletAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Wallet Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter destination address" className="bg-[#0A0A0A] border-white/10 text-white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="walletAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Account IBAN / Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter account number" className="bg-[#0A0A0A] border-white/10 text-white" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Bank Details (SWIFT/BIC, Bank Name)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter bank details" className="bg-[#0A0A0A] border-white/10 text-white" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                    <p className="text-xs text-orange-200 leading-relaxed">
                      Withdrawals may take 1-3 business days to process depending on the method and your KYC verification status.
                    </p>
                  </div>

                  <Button type="submit" disabled={createWithdrawal.isPending} className="w-full bg-gold-gradient text-black font-semibold">
                    {createWithdrawal.isPending ? 'Processing...' : 'Submit Request'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="font-playfair">Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full bg-white/5" />)}
                </div>
              ) : withdrawals && withdrawals.length > 0 ? (
                <div className="rounded-md border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-primary">Method</TableHead>
                        <TableHead className="text-primary">Destination</TableHead>
                        <TableHead className="text-primary">Amount</TableHead>
                        <TableHead className="text-primary">Date</TableHead>
                        <TableHead className="text-primary text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((w) => (
                        <TableRow key={w.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="uppercase text-xs tracking-wider text-gray-300">{w.method.replace('_', ' ')}</TableCell>
                          <TableCell className="font-mono text-xs text-gray-400 max-w-[150px] truncate" title={w.walletAddress}>{w.walletAddress}</TableCell>
                          <TableCell className="font-medium text-white">{formatCurrency(w.amount)}</TableCell>
                          <TableCell className="text-gray-400">{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              {w.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"><Clock className="w-3 h-3"/> Pending</span>}
                              {w.status === 'approved' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20"><CheckCircle2 className="w-3 h-3"/> Approved</span>}
                              {w.status === 'declined' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20"><XCircle className="w-3 h-3"/> Declined</span>}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No withdrawal history found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
