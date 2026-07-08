import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0A] p-4">
      <Card className="w-full max-w-md bg-[#111111] border-primary/20 glass-card">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <FileQuestion className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-playfair font-bold text-white mb-2">404</h1>
          <p className="text-gray-400 mb-6">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link href="/">
            <Button className="bg-gold-gradient text-black font-semibold hover:opacity-90">
              Return Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
