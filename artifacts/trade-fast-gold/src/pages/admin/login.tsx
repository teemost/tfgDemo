import React from 'react';
import { Link, Redirect } from 'wouter';
import { useGetMe } from '@workspace/api-client-react';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function AdminLogin() {
  const { isAuthenticated, isLoading: isSessionLoading } = useSession();
  const { data: profile, isLoading } = useGetMe({ query: { enabled: isAuthenticated } });

  if (isSessionLoading || (isAuthenticated && isLoading)) return null;

  if (isAuthenticated && profile) {
    if (profile.role === 'admin') return <Redirect to="/admin" />;
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-playfair font-bold text-white">Access Denied</h2>
          <p className="text-gray-400">This portal is restricted to administrators only.</p>
          <a href="/dashboard" className="inline-block mt-4 px-6 py-2 bg-gold-gradient text-black font-semibold rounded-lg hover:opacity-90 transition-opacity">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4 relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-gold-gradient flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
          <ShieldAlert className="w-8 h-8 text-black" />
        </div>
        <h1 className="text-3xl font-playfair font-bold text-white">Admin Portal</h1>
        <p className="text-gray-400 mt-2 text-sm mb-8">TFG — Restricted Access</p>

        <Link href="/login">
          <Button
            size="lg"
            className="w-full h-14 bg-gold-gradient text-black font-semibold text-lg hover:opacity-90"
          >
            Sign In
          </Button>
        </Link>

        <p className="text-sm text-gray-500 mt-6">
          Need an account?{' '}
          <Link href="/admin/register" className="text-primary hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>

      <p className="relative z-10 text-xs text-gray-600 mt-8">
        Unauthorized access attempts are logged and reported.
      </p>
    </div>
  );
}
