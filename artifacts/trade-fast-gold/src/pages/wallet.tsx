import React from 'react';
import { useListWallets, useWalletTransfer } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet as WalletIcon, ArrowRightLeft, TrendingUp, Gift, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { WalletTransferInputFromWalletType, WalletTransferInputToWalletType } from '@workspace/api-client-react/src/generated/api.schemas';

const transferSchema = z.object({
  fromWalletType: z.enum(['main', 'profit', 'bonus', 'referral'] as const),
  toWalletType: z.enum(['main', 'profit', 'bonus', 'referral'] as const),
  amount: z.coerce.number().min(1, "Minimum transfer amount is $1"),
}).refine(data => data.fromWalletType !== data.toWalletType, {
  message: "Source and destination wallets must be different",
  path: ["toWalletType"],
});

export default function Wallet() {
  const { data: wallets, isLoading, refetch } = useListWallets();
  const transfer = useWalletTransfer();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromWalletType: 'profit',
      toWalletType: 'main',
      amount: 0,
    },
  });

  const onSubmit = (values: z.infer<typeof transferSchema>) => {
    transfer.mutate({
      data: {
        fromWalletType: values.fromWalletType as WalletTransferInputFromWalletType,
        toWalletType: values.toWalletType as WalletTransferInputToWalletType,
        amount: values.amount,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Transfer Successful",
          description: `Successfully transferred $${values.amount}.`,
        });
        form.reset();
        refetch();
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Transfer Failed",
          description: error.message || "Insufficient funds.",
        });
      }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'main': return <WalletIcon className="h-6 w-6 text-blue-400" />;
      case 'profit': return <TrendingUp className="h-6 w-6 text-green-400" />;
      case 'bonus': return <Gift className="h-6 w-6 text-purple-400" />;
      case 'referral': return <Users className="h-6 w-6 text-orange-400" />;
      default: return <WalletIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-playfair font-bold text-white mb-6">Wallets</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 bg-white/5 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-white tracking-wide">Wallet Overview</h1>
        <p className="text-gray-400 mt-2">Manage your funds across different wallet types.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {wallets?.map((wallet) => (
          <Card key={wallet.id} className="glass-card relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 capitalize">{wallet.type} Wallet</CardTitle>
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                {getWalletIcon(wallet.type)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white font-mono">{formatCurrency(wallet.balance)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-playfair flex items-center gap-2">
              <ArrowRightLeft className="text-primary h-5 w-5" /> Internal Transfer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fromWalletType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">From</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white capitalize">
                              <SelectValue placeholder="Select wallet" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#111111] border-white/10 text-white">
                            {wallets?.map(w => (
                              <SelectItem key={w.id} value={w.type} className="capitalize">
                                {w.type} Wallet ({formatCurrency(w.balance)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toWalletType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">To</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white capitalize">
                              <SelectValue placeholder="Select wallet" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#111111] border-white/10 text-white">
                            {wallets?.map(w => (
                              <SelectItem key={w.id} value={w.type} className="capitalize">
                                {w.type} Wallet
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <Button type="submit" disabled={transfer.isPending} className="w-full bg-gold-gradient text-black font-semibold">
                  {transfer.isPending ? 'Processing...' : 'Transfer Funds'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-playfair">Wallet Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-300">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                <WalletIcon className="h-4 w-4 text-blue-400" /> Main Wallet
              </h4>
              <p className="text-gray-400">Used for making deposits and purchasing investment plans. You can also withdraw directly from this wallet.</p>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" /> Profit Wallet
              </h4>
              <p className="text-gray-400">Receives daily returns from your active investments. Transfer to Main Wallet to withdraw or reinvest.</p>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-400" /> Referral Wallet
              </h4>
              <p className="text-gray-400">Commissions earned from your referred users are deposited here. Transfer to Main Wallet to utilize.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
