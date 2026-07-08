import React, { useState } from 'react';
import { useListAdminTickets, useGetMe } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Redirect, Link } from 'wouter';
import { AlertCircle, ExternalLink } from 'lucide-react';

export default function AdminTickets() {
  const { data: profile } = useGetMe({ query: { enabled: true } });
  const isAdmin = profile?.role === 'admin';
  
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('open');
  
  const { data: ticketsPage, isLoading } = useListAdminTickets({
    page,
    status: status !== 'all' ? status : undefined
  }, { query: { enabled: isAdmin } });

  if (!isAdmin && profile) return <Redirect to="/dashboard" />;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Open</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">In Progress</Badge>;
      case 'resolved': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Resolved</Badge>;
      case 'closed': return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">Closed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch(p) {
      case 'low': return <span className="text-gray-400 text-xs">Low</span>;
      case 'medium': return <span className="text-blue-400 text-xs">Medium</span>;
      case 'high': return <span className="text-orange-400 text-xs">High</span>;
      case 'urgent': return <span className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={12}/> Urgent</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-playfair font-bold text-primary">Support Tickets</h1>
          <p className="text-gray-400 text-sm mt-1">Manage and respond to user inquiries.</p>
        </div>
        
        <div className="w-48">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="bg-[#111111] border-white/10 text-white">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent className="bg-[#111111] border-white/10 text-white">
              <SelectItem value="open">Open / Unresolved</SelectItem>
              <SelectItem value="closed">Closed / Resolved</SelectItem>
              <SelectItem value="all">All Tickets</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-[#111111] border-white/10">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5" />)}
            </div>
          ) : ticketsPage?.data && ticketsPage.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-primary w-16">ID</TableHead>
                    <TableHead className="text-primary">User ID</TableHead>
                    <TableHead className="text-primary">Subject</TableHead>
                    <TableHead className="text-primary">Priority</TableHead>
                    <TableHead className="text-primary">Status</TableHead>
                    <TableHead className="text-primary">Updated</TableHead>
                    <TableHead className="text-primary text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketsPage.data.map((t) => (
                    <TableRow key={t.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-mono text-xs text-gray-500">#{t.id}</TableCell>
                      <TableCell className="text-sm">User #{t.userId}</TableCell>
                      <TableCell className="font-medium text-white max-w-[300px] truncate">{t.subject}</TableCell>
                      <TableCell>{getPriorityBadge(t.priority)}</TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {new Date(t.updatedAt || t.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/support/${t.id}`} className="inline-flex items-center text-primary text-sm hover:underline">
                          Respond <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">No support tickets found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
