import React from 'react';
import { useGetTicket, useReplyTicket, useGetMe } from '@workspace/api-client-react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Send, ArrowLeft, User, ShieldAlert } from 'lucide-react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { getGetTicketQueryKey } from '@workspace/api-client-react/src/generated/api';

const replySchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
});

export default function SupportTicket() {
  const { id } = useParams();
  const ticketId = parseInt(id || '0', 10);
  const { data: ticket, isLoading } = useGetTicket(ticketId);
  const { data: profile } = useGetMe({ query: { enabled: true } });
  const replyTicket = useReplyTicket();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { message: '' },
  });

  const onSubmit = (values: z.infer<typeof replySchema>) => {
    replyTicket.mutate({
      id: ticketId,
      data: { message: values.message }
    }, {
      onSuccess: (newMsg) => {
        form.reset();
        // Optimistic update
        queryClient.setQueryData(getGetTicketQueryKey(ticketId), (old: any) => {
          if (!old) return old;
          return { ...old, messages: [...old.messages, newMsg] };
        });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Failed to send", description: err.message });
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

  if (isLoading || !ticket) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-32 bg-white/5" />
        <Skeleton className="h-24 w-full bg-white/5 rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-3/4 bg-white/5 rounded-xl" />
          <Skeleton className="h-32 w-3/4 bg-white/5 rounded-xl ml-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <Link href="/support" className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Support
      </Link>

      <div className="p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-playfair font-bold text-white tracking-wide">{ticket.subject}</h1>
            {getStatusBadge(ticket.status)}
          </div>
          <div className="text-sm text-gray-400 flex gap-4">
            <span>Ticket #{ticket.id}</span>
            <span className="capitalize">Category: {ticket.category}</span>
            <span className="capitalize text-primary">Priority: {ticket.priority}</span>
          </div>
        </div>
        <div className="text-sm text-gray-500 text-right">
          Opened: {new Date(ticket.createdAt).toLocaleString()}
        </div>
      </div>

      <div className="space-y-6 pb-6">
        {ticket.messages.map((msg: any) => {
          const isUser = msg.senderRole === 'user';
          return (
            <div key={msg.id} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
              <Avatar className="w-10 h-10 border border-white/10 shrink-0">
                {isUser ? (
                  <AvatarFallback className="bg-primary/20 text-primary"><User size={20}/></AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-gold-gradient text-black font-bold text-xs">TFG</AvatarFallback>
                )}
              </Avatar>
              <div className={`max-w-[85%] ${isUser ? 'items-end text-right' : 'items-start text-left'} flex flex-col`}>
                <div className="mb-1 text-xs text-gray-500 flex items-center gap-2 px-1">
                  <span className="font-semibold text-gray-300">{isUser ? 'You' : 'Support Agent'}</span>
                  <span>{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap text-left ${
                  isUser 
                    ? 'bg-primary/20 border border-primary/30 text-white rounded-tr-sm' 
                    : 'bg-[#111111] border border-white/10 text-gray-200 rounded-tl-sm'
                }`}>
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {ticket.status !== 'closed' && ticket.status !== 'resolved' ? (
        <Card className="glass-card mt-auto">
          <CardContent className="p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Type your reply here..." 
                          className="bg-[#0A0A0A] border-white/10 text-white resize-none min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={replyTicket.isPending} className="bg-gold-gradient text-black font-semibold px-8">
                    {replyTicket.isPending ? 'Sending...' : 'Send Reply'} <Send className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <div className="p-4 text-center rounded-xl bg-white/5 border border-white/10 text-gray-400">
          This ticket has been closed. If you need further assistance, please open a new ticket.
        </div>
      )}
    </div>
  );
}
