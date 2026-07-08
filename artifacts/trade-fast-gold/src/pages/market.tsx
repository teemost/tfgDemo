import React from 'react';
import { useGetMarketTickers } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// Generate some fake sparkline data based on trend
const generateSparklineData = (isPositive: boolean) => {
  const data = [];
  let base = 100;
  for (let i = 0; i < 20; i++) {
    const change = (Math.random() - (isPositive ? 0.3 : 0.7)) * 5;
    base = base + change;
    data.push({ value: base });
  }
  return data;
};

export default function Market() {
  const { data: tickers, isLoading } = useGetMarketTickers();

  const formatPrice = (val: number, symbol: string) => {
    const digits = val < 1 ? 4 : val > 1000 ? 2 : 2;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits 
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-playfair font-bold text-white mb-6">Live Markets</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 bg-white/5 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-white tracking-wide">Live Markets</h1>
          <p className="text-gray-400 mt-2 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Real-time price feeds for our supported assets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickers?.map((ticker) => {
          const isPositive = ticker.changePercent24h >= 0;
          const chartData = generateSparklineData(isPositive);
          const color = isPositive ? '#22c55e' : '#ef4444';
          
          return (
            <Card key={ticker.symbol} className="glass-card relative overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    {ticker.iconUrl ? (
                      <img src={ticker.iconUrl} alt={ticker.symbol} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
                        {ticker.symbol.substring(0, 1)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white">{ticker.symbol}</h3>
                      <p className="text-xs text-gray-400">{ticker.name}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(ticker.changePercent24h).toFixed(2)}%
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-bold font-mono tracking-tight text-white">
                    {formatPrice(ticker.price, ticker.symbol)}
                  </div>
                  <div className="h-[60px] w-full mt-4 -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id={`gradient-${ticker.symbol}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={color} 
                          fillOpacity={1} 
                          fill={`url(#gradient-${ticker.symbol})`} 
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
