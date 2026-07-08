import React, { useState } from 'react';
import { useListPlans, useCreateInvestment } from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@clerk/react';
import { Plan } from '@workspace/api-client-react/src/generated/api.schemas';

const investSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
});

export default function Plans() {
  const { isLoaded, user } = useUser();
  const { data: plans, isLoading } = useListPlans();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { toast } = useToast();
  
  const createInvestment = useCreateInvestment();

  const form = useForm<z.infer<typeof investSchema>>({
    resolver: zodResolver(investSchema),
    defaultValues: {
      amount: 0,
    },
  });

  // When selected plan changes, update validation rules if needed or set default amount
  React.useEffect(() => {
    if (selectedPlan) {
      form.setValue('amount', selectedPlan.minAmount);
    }
  }, [selectedPlan, form]);

  const onSubmit = (values: z.infer<typeof investSchema>) => {
    if (!selectedPlan) return;
    
    if (values.amount < selectedPlan.minAmount || values.amount > selectedPlan.maxAmount) {
      form.setError('amount', { message: `Amount must be between $${selectedPlan.minAmount} and $${selectedPlan.maxAmount}` });
      return;
    }

    createInvestment.mutate({
      data: {
        planId: selectedPlan.id,
        amount: values.amount,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Investment Successful",
          description: `You have successfully invested $${values.amount} in ${selectedPlan.name}`,
        });
        setSelectedPlan(null);
        form.reset();
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Investment Failed",
          description: error.message || "Insufficient funds or invalid amount.",
        });
      }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-playfair font-bold text-white mb-2">Investment Plans</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[450px] rounded-xl bg-white/5" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-white tracking-wide">Investment Plans</h1>
        <p className="text-gray-400 mt-2 max-w-2xl">
          Choose a plan that fits your financial goals. Our institutional-grade strategies are designed to maximize returns while managing risk.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-stretch">
        {plans?.filter(p => p.isActive).map((plan, index) => (
          <Card key={plan.id} className={`glass-card relative overflow-hidden flex flex-col ${plan.tier === 'gold' || plan.tier === 'vip' ? 'border-primary/50 shadow-[0_0_30px_rgba(212,175,55,0.1)]' : ''}`}>
            {plan.tier === 'gold' && (
              <div className="absolute top-0 right-0 bg-gold-gradient text-black text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Most Popular
              </div>
            )}
            <CardHeader className="text-center pt-8 pb-4 border-b border-white/5">
              <CardTitle className="font-playfair text-2xl uppercase tracking-widest text-primary mb-2">
                {plan.name}
              </CardTitle>
              <div className="text-4xl font-bold text-white mb-2">
                {plan.roiPercent}% <span className="text-lg text-gray-500 font-normal">ROI</span>
              </div>
              <CardDescription className="text-gray-400">
                After {plan.durationDays} Days
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-1">
              <div className="space-y-4 mb-8">
                <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                  <span className="text-gray-400">Min. Deposit</span>
                  <span className="font-semibold text-white">{formatCurrency(plan.minAmount)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                  <span className="text-gray-400">Max. Deposit</span>
                  <span className="font-semibold text-white">{formatCurrency(plan.maxAmount)}</span>
                </div>
              </div>

              <ul className="space-y-3">
                {plan.features?.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
                {!plan.features?.length && (
                  <>
                    <li className="flex items-start gap-3 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Principal Return Included</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>24/7 Expert Support</span>
                    </li>
                  </>
                )}
              </ul>
            </CardContent>
            <CardFooter className="pb-8 pt-4">
              <Button 
                className="w-full h-12 bg-white/5 border border-white/10 hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all font-semibold"
                onClick={() => setSelectedPlan(plan)}
              >
                Select Plan
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="bg-[#111111] border-primary/20 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl">Invest in {selectedPlan?.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the amount you wish to invest. Your returns will be calculated automatically.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Expected ROI:</span>
                  <span className="text-primary font-bold">{selectedPlan?.roiPercent}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">{selectedPlan?.durationDays} Days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Limits:</span>
                  <span className="text-white">${selectedPlan?.minAmount} - ${selectedPlan?.maxAmount}</span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Investment Amount (USD)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="pl-8 bg-[#0A0A0A] border-white/10 text-white focus-visible:ring-primary" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex gap-3">
                <Shield className="h-5 w-5 text-primary shrink-0" />
                <p className="text-xs text-gray-400">
                  By confirming, this amount will be deducted from your main wallet balance. Ensure you have sufficient funds before proceeding.
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setSelectedPlan(null)} className="text-gray-400 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" disabled={createInvestment.isPending} className="bg-gold-gradient text-black font-semibold">
                  {createInvestment.isPending ? 'Processing...' : 'Confirm Investment'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
