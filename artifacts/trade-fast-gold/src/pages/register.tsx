import React from 'react';
import { Link, Redirect } from 'wouter';
import { useSession, login } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { UserPlus, CheckCircle2 } from 'lucide-react';

const perks = [
  'AI-driven gold, crypto & forex portfolios',
  'Bank-grade security & cold storage',
  'Instant global deposits & withdrawals',
];

export default function Register() {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) return null;
  if (isAuthenticated) return <Redirect to="/dashboard" />;

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
        <div className="glass-card rounded-2xl border border-white/10 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-playfair font-bold text-white">Create Your Account</h1>
          <p className="text-gray-400 mt-2 text-sm mb-6">Join thousands of elite investors today</p>

          <ul className="text-left space-y-2 mb-8">
            {perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2 text-sm text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                {perk}
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            className="w-full h-14 bg-gold-gradient text-black font-semibold text-lg hover:opacity-90"
            onClick={login}
          >
            Create Account
          </Button>

          <p className="text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
