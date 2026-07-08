import React, { useState } from 'react';
import { useListTransactions } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownToLine, ArrowUpFromLine, TrendingUp, RefreshCw, Users, Gift, Activity } from 'lucide-react';
import { ListTransactionsType } from '@workspace/api-client-react/src/generated/api.schemas';
import { Button } from '@/components/ui/button';

export default function Transactions() {
  const [filterType, setFilterType] = useState<ListTransactionsType | 'all'>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: transactionPage, isLoading } = useListTransactions({
    type: filterType === 'all' ? undefined : filterType,
    page,
    limit
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const getTransactionIcon = (type: string) => {
    switch(type) {
      case 'deposit': return <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center"><ArrowDownToLine size={14}/></div>;
      case 'withdrawal': return <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center"><ArrowUpFromLine size={14}/></div>;
      case 'investment': return <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Activity size={14}/></div>;
      case 'profit': return <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center"><TrendingUp size={14}/></div>;
      case 'transfer': return <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center"><RefreshCw size={14}/></div>;
      case 'referral': return <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center"><Users size={14}/></div>;
      case 'bonus': return <div className="w-8 h-8 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center"><Gift size={14}/></div>;
      default: return <div className="w-8 h-8 rounded-full bg-gray-500/10 text-gray-500 flex items-center justify-center"><Activity size={14}/></div>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-white tracking-wide">Transaction History</h1>
          <p className="text-gray-400 mt-2">A complete record of all your account activities.</p>
        </div>
        
        <div className="w-48">
          <Select value={filterType} onValueChange={(v: any) => { setFilterType(v); setPage(1); }}>
            <SelectTrigger className="bg-[#111111] border-white/10 text-white">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-[#111111] border-white/10 text-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
              <SelectItem value="withdrawal">Withdrawals</SelectItem>
              <SelectItem value="investment">Investments</SelectItem>
              <SelectItem value="profit">Profits</SelectItem>
              <SelectItem value="transfer">Transfers</SelectItem>
              <SelectItem value="referral">Referrals</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5" />)}
            </div>
          ) : transactionPage?.data && transactionPage.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-primary w-16">Type</TableHead>
                    <TableHead className="text-primary">Description</TableHead>
                    <TableHead className="text-primary">Amount</TableHead>
                    <TableHead className="text-primary">Status</TableHead>
                    <TableHead className="text-primary text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionPage.data.map((tx) => (
                    <TableRow key={tx.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>{getTransactionIcon(tx.type)}</TableCell>
                      <TableCell>
                        <p className="text-white font-medium capitalize">{tx.type}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[300px]" title={tx.description}>{tx.description}</p>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          ['deposit', 'profit', 'referral', 'bonus'].includes(tx.type) ? 'text-green-400' :
                          tx.type === 'transfer' ? 'text-white' : 'text-red-400'
                        }`}>
                          {['deposit', 'profit', 'referral', 'bonus'].includes(tx.type) ? '+' :
                           tx.type === 'transfer' ? '' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                          tx.status === 'completed' || tx.status === 'confirmed' || tx.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                          tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {tx.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-gray-400 text-sm">
                        {new Date(tx.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {transactionPage.total > limit && (
                <div className="p-4 border-t border-white/10 flex justify-between items-center bg-black/20">
                  <p className="text-xs text-gray-500">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, transactionPage.total)} of {transactionPage.total} entries
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-white/10 bg-transparent text-white hover:bg-white/5"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-white/10 bg-transparent text-white hover:bg-white/5"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page * limit >= transactionPage.total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <p>No transactions found for the selected criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
