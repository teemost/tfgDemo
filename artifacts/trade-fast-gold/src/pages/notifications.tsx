import React from 'react';
import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, ArrowDownToLine, ArrowUpFromLine, Activity, ShieldAlert, Check, Users, Gift } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getListNotificationsQueryKey } from '@workspace/api-client-react/src/generated/api';

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => {
        // Optimistic update
        queryClient.setQueryData(getListNotificationsQueryKey(), (old: any) => {
          if (!old) return old;
          return old.map((n: any) => n.id === id ? { ...n, isRead: true } : n);
        });
      }
    });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getListNotificationsQueryKey(), (old: any) => {
          if (!old) return old;
          return old.map((n: any) => ({ ...n, isRead: true }));
        });
      }
    });
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'deposit': return <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center"><ArrowDownToLine size={18}/></div>;
      case 'withdrawal': return <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center"><ArrowUpFromLine size={18}/></div>;
      case 'investment': return <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Activity size={18}/></div>;
      case 'profit': return <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center"><Gift size={18}/></div>;
      case 'referral': return <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center"><Users size={18}/></div>;
      case 'security': 
      case 'kyc': return <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center"><ShieldAlert size={18}/></div>;
      default: return <div className="w-10 h-10 rounded-full bg-gray-500/10 text-gray-400 flex items-center justify-center"><Bell size={18}/></div>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-playfair font-bold text-white mb-6">Notifications</h1>
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full bg-white/5 rounded-xl" />)}
      </div>
    );
  }

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-white tracking-wide">Notifications</h1>
          <p className="text-gray-400 mt-2">You have {unreadCount} unread message{unreadCount !== 1 && 's'}.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" className="border-white/10 hover:bg-white/5 text-gray-300" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
            <Check className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications && notifications.length > 0 ? (
          notifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={`glass-card transition-all cursor-pointer ${!notif.isRead ? 'border-primary/30 shadow-[0_0_15px_rgba(212,175,55,0.05)]' : 'opacity-70'}`}
              onClick={() => !notif.isRead && handleMarkRead(notif.id)}
            >
              <CardContent className="p-4 flex gap-4 sm:items-center">
                <div className="shrink-0 mt-1 sm:mt-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                    <h4 className={`font-semibold truncate ${!notif.isRead ? 'text-white' : 'text-gray-300'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${!notif.isRead ? 'text-gray-300' : 'text-gray-500'}`}>
                    {notif.message}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2 sm:mt-0" />
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 text-gray-500 bg-white/5 rounded-xl border border-white/10">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>You're all caught up! No notifications right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
