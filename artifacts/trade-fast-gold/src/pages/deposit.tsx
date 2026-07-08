import React from 'react';
import { useListDeposits, useCreateDeposit } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { DepositInputMethod } from '@workspace/api-client-react/src/generated/api.schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, CheckCircle2, XCircle, Copy } from 'lucide-react';

const depositSchema = z.object({
  amount: z.coerce.number().min(10, 'Minimum deposit is $10'),
  method: z.enum(['bank_transfer', 'card', 'bitcoin', 'ethereum', 'usdt_trc20', 'usdt_erc20'] as const),
  transactionHash: z.string().optional(),
});

export default function Deposit() {
  const { data: deposits, isLoading, refetch } = useListDeposits();
  const createDeposit = useCreateDeposit();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 0,
      method: 'bitcoin',
      transactionHash: '',
    },
  });

  const watchMethod = form.watch('method');

  const onSubmit = (values: z.infer<typeof depositSchema>) => {
    createDeposit.mutate({
      data: {
        amount: values.amount,
        method: values.method as DepositInputMethod,
        transactionHash: values.transactionHash,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Deposit Submitted",
          description: "Your deposit request has been submitted and is pending confirmation.",
        });
        form.reset();
        refetch();
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: error.message || "An error occurred while submitting your deposit.",
        });
      }
    });
  };

  const getPaymentDetails = (method: string) => {
    switch(method) {
      case 'bitcoin': return { addr: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', net: 'Bitcoin (BTC)' };
      case 'ethereum': return { addr: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', net: 'ERC20' };
      case 'usdt_trc20': return { addr: 'TUX2Y3GqVj4r8fL9yM1v4wQ6wN8h5K7j9P', net: 'TRC20' };
      case 'usdt_erc20': return { addr: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', net: 'ERC20' };
      case 'bank_transfer': return { info: 'Please contact your account manager for bank details.', net: 'Wire Transfer' };
      default: return null;
    }
  };

  const paymentDetails = getPaymentDetails(watchMethod);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard", duration: 2000 });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-white tracking-wide">Deposit Funds</h1>
        <p className="text-gray-400 mt-2 max-w-2xl">Add funds to your main wallet to start investing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-playfair">New Deposit</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white">
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#111111] border-white/10 text-white">
                            <SelectItem value="bitcoin">Bitcoin (BTC)</SelectItem>
                            <SelectItem value="ethereum">Ethereum (ETH)</SelectItem>
                            <SelectItem value="usdt_trc20">USDT (TRC20)</SelectItem>
                            <SelectItem value="usdt_erc20">USDT (ERC20)</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {paymentDetails && (
                    <div className="p-4 rounded-lg bg-white/5 border border-primary/20 space-y-3">
                      <p className="text-xs text-primary font-semibold uppercase tracking-wider">Payment Instructions</p>
                      <div className="text-sm text-gray-300">Network: <span className="text-white font-medium">{paymentDetails.net}</span></div>
                      
                      {'addr' in paymentDetails ? (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400">Send exact amount to this address:</p>
                          <div className="flex items-center gap-2 bg-[#0A0A0A] p-2 rounded border border-white/10">
                            <code className="text-xs text-primary flex-1 break-all">{paymentDetails.addr}</code>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => copyToClipboard(paymentDetails.addr)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-300">{paymentDetails.info}</p>
                      )}
                    </div>
                  )}

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

                  {watchMethod !== 'bank_transfer' && watchMethod !== 'card' && (
                    <FormField
                      control={form.control}
                      name="transactionHash"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Transaction Hash (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter TxHash after sending" className="bg-[#0A0A0A] border-white/10 text-white" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">Helps speed up verification.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button type="submit" disabled={createDeposit.isPending} className="w-full bg-gold-gradient text-black font-semibold">
                    {createDeposit.isPending ? 'Submitting...' : 'I Have Paid'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="font-playfair">Deposit History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full bg-white/5" />)}
                </div>
              ) : deposits && deposits.length > 0 ? (
                <div className="rounded-md border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-primary">Reference</TableHead>
                        <TableHead className="text-primary">Method</TableHead>
                        <TableHead className="text-primary">Amount</TableHead>
                        <TableHead className="text-primary">Date</TableHead>
                        <TableHead className="text-primary text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deposits.map((deposit) => (
                        <TableRow key={deposit.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="font-mono text-xs text-gray-400">{deposit.reference}</TableCell>
                          <TableCell className="uppercase text-xs tracking-wider">{deposit.method.replace('_', ' ')}</TableCell>
                          <TableCell className="font-medium text-white">{formatCurrency(deposit.amount)}</TableCell>
                          <TableCell className="text-gray-400">{new Date(deposit.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              {deposit.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"><Clock className="w-3 h-3"/> Pending</span>}
                              {deposit.status === 'confirmed' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20"><CheckCircle2 className="w-3 h-3"/> Confirmed</span>}
                              {deposit.status === 'rejected' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20"><XCircle className="w-3 h-3"/> Rejected</span>}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No deposit history found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
