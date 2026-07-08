import React from 'react';
import { Link, Redirect } from 'wouter';
import { useSession, useLogin } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { isAuthenticated, isLoading } = useSession();
  const loginMutation = useLogin();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (isLoading) return null;
  if (isAuthenticated) return <Redirect to="/dashboard" />;

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values, {
      onError: (err: any) => {
        toast({ variant: 'destructive', title: 'Sign in failed', description: err.message });
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4 relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
      </div>

      <Link href="/" className="relative z-10 flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]">
          <span className="text-black font-playfair font-bold text-lg">TFG</span>
        </div>
        <span className="font-playfair font-bold text-xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F4C842]">TRADE FAST GOLD</span>
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card rounded-2xl border border-white/10 p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-playfair font-bold text-white">Welcome Back</h1>
            <p className="text-gray-400 mt-2 text-sm">Sign in to access your investment portal</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" className="bg-[#0A0A0A] border-white/10 text-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="bg-[#0A0A0A] border-white/10 text-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 bg-gold-gradient text-black font-semibold text-lg hover:opacity-90"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
