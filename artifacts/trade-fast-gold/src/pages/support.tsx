import React from 'react';
import { useListTickets, useCreateTicket } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { MessageSquare, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { TicketInputCategory, TicketInputPriority } from '@workspace/api-client-react/src/generated/api.schemas';

const ticketSchema = z.object({
  subject: z.string().min(5, 'Subject is too short'),
  category: z.enum(['deposit', 'withdrawal', 'investment', 'account', 'technical', 'other'] as const),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  message: z.string().min(10, 'Message is too short'),
});

export default function Support() {
  const { data: tickets, isLoading, refetch } = useListTickets();
  const createTicket = useCreateTicket();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);

  const form = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: '',
      category: 'account',
      priority: 'medium',
      message: '',
    },
  });

  const onSubmit = (values: z.infer<typeof ticketSchema>) => {
    createTicket.mutate({
      data: {
        subject: values.subject,
        category: values.category as TicketInputCategory,
        priority: values.priority as TicketInputPriority,
        message: values.message,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Ticket created successfully" });
        setIsOpen(false);
        form.reset();
        refetch();
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    });
  };

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-white tracking-wide">Support Center</h1>
          <p className="text-gray-400 mt-2">Need help? Open a ticket and our 24/7 support team will assist you.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold-gradient text-black font-bold whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" /> New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#111111] border-primary/20 text-white sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-playfair text-2xl">Create Support Ticket</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief summary of your issue" className="bg-[#0A0A0A] border-white/10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#0A0A0A] border-white/10">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#111111] border-white/10">
                            <SelectItem value="deposit">Deposit</SelectItem>
                            <SelectItem value="withdrawal">Withdrawal</SelectItem>
                            <SelectItem value="investment">Investment</SelectItem>
                            <SelectItem value="account">Account / KYC</SelectItem>
                            <SelectItem value="technical">Technical Issue</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#0A0A0A] border-white/10">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#111111] border-white/10">
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Message</FormLabel>
                      <FormControl>
                        <Textarea rows={6} placeholder="Provide details here..." className="bg-[#0A0A0A] border-white/10 resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createTicket.isPending} className="bg-gold-gradient text-black font-semibold">
                    {createTicket.isPending ? 'Submitting...' : 'Submit Ticket'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5" />)}
            </div>
          ) : tickets && tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-primary w-20">ID</TableHead>
                    <TableHead className="text-primary">Subject</TableHead>
                    <TableHead className="text-primary">Category</TableHead>
                    <TableHead className="text-primary">Priority</TableHead>
                    <TableHead className="text-primary">Status</TableHead>
                    <TableHead className="text-primary text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t) => (
                    <TableRow key={t.id} className="border-white/10 hover:bg-white/5 group relative">
                      <TableCell className="font-mono text-gray-500">#{t.id}</TableCell>
                      <TableCell>
                        <Link href={`/support/${t.id}`} className="font-medium text-white hover:text-primary transition-colors block before:absolute before:inset-0">
                          {t.subject}
                        </Link>
                      </TableCell>
                      <TableCell className="capitalize text-gray-400 text-sm">{t.category}</TableCell>
                      <TableCell>{getPriorityBadge(t.priority)}</TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="text-right text-gray-500 text-sm">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>You have no open support tickets.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
