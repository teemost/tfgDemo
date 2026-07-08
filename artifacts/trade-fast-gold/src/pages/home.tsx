import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, Globe2, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden selection:bg-primary/30 selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <span className="text-black font-playfair font-bold text-lg">TFG</span>
            </div>
            <span className="font-playfair font-bold text-xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F4C842]">TRADE FAST GOLD</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#plans" className="hover:text-primary transition-colors">Plans</a>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#about" className="hover:text-primary transition-colors">About</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-gold-gradient text-black font-semibold hover:opacity-90 shadow-[0_0_15px_rgba(212,175,55,0.2)]">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block py-1 px-3 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6 tracking-wide uppercase">
              Premium Wealth Management
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-playfair font-bold mb-6 leading-tight">
              Invest with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4C842] to-[#B8960C]">Precision</span><br/>
              Grow with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4C842] to-[#B8960C]">Power</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
              Elite institutional-grade investment platform for high-net-worth individuals. Secure your legacy with our AI-driven gold, crypto, and forex portfolios.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 bg-gold-gradient text-black font-semibold text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <Link href="/sign-up">
                  Start Investing Now <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 border-primary/30 text-white hover:bg-primary/10">
                <Link href="/sign-in">
                  Client Portal
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-[#111111]/50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="p-6">
            <h3 className="text-4xl font-playfair font-bold text-primary mb-2">$500M+</h3>
            <p className="text-sm text-gray-400 uppercase tracking-widest">Assets Managed</p>
          </div>
          <div className="p-6">
            <h3 className="text-4xl font-playfair font-bold text-primary mb-2">12,500+</h3>
            <p className="text-sm text-gray-400 uppercase tracking-widest">Active Investors</p>
          </div>
          <div className="p-6">
            <h3 className="text-4xl font-playfair font-bold text-primary mb-2">145</h3>
            <p className="text-sm text-gray-400 uppercase tracking-widest">Countries Supported</p>
          </div>
          <div className="p-6">
            <h3 className="text-4xl font-playfair font-bold text-primary mb-2">99.9%</h3>
            <p className="text-sm text-gray-400 uppercase tracking-widest">Uptime Reliability</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">Why Choose Trade Fast Gold</h2>
            <p className="text-gray-400 text-lg">We combine institutional-grade security with unprecedented market access, delivering a private banking experience for the digital age.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 hover:border-primary/30 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">Bank-Grade Security</h3>
              <p className="text-gray-400 leading-relaxed">Your funds are protected by military-grade encryption, cold storage solutions, and comprehensive insurance policies.</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 hover:border-primary/30 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">Consistent Returns</h3>
              <p className="text-gray-400 leading-relaxed">Our algorithmic trading systems combined with expert human oversight deliver market-leading returns across all plans.</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 hover:border-primary/30 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Globe2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">Global Access</h3>
              <p className="text-gray-400 leading-relaxed">Deposit and withdraw using major cryptocurrencies or bank transfers from anywhere in the world, instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-playfair font-bold mb-8">Ready to Elevate Your Portfolio?</h2>
          <p className="text-xl text-gray-300 mb-10">Join thousands of elite investors who trust Trade Fast Gold with their wealth.</p>
          <Link href="/sign-up">
            <Button size="lg" className="h-16 px-10 text-lg bg-gold-gradient text-black font-bold hover:scale-105 transition-transform shadow-[0_0_30px_rgba(212,175,55,0.4)]">
              Create Your Account Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 text-center text-gray-500">
        <p>© {new Date().getFullYear()} TRADE FAST GOLD. All rights reserved.</p>
      </footer>
    </div>
  );
}
