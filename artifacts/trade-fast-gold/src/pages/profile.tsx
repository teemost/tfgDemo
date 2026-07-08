import React from 'react';
import { useGetMe, useUpdateMe } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/hooks/use-session';
import { Save, User, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetMeQueryKey } from '@workspace/api-client-react/src/generated/api';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
  country: z.string().optional(),
});

export default function Profile() {
  const { isAuthenticated } = useSession();
  const { data: profile, isLoading } = useGetMe({ query: { enabled: isAuthenticated } });
  const updateMe = useUpdateMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      country: '',
    },
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        country: profile.country || '',
      });
    }
  }, [profile, form]);

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateMe.mutate({
      data: values
    }, {
      onSuccess: (data) => {
        toast({ title: "Profile updated successfully" });
        queryClient.setQueryData(getGetMeQueryKey(), data);
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Update failed", description: err.message });
      }
    });
  };

  if (isLoading || !profile) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-playfair font-bold text-white mb-6">Profile Settings</h1>
        <Skeleton className="h-[400px] w-full bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-white tracking-wide">Profile Settings</h1>
        <p className="text-gray-400 mt-2">Manage your personal information and account details.</p>
      </div>

      <Card className="glass-card">
        <CardHeader className="border-b border-white/5 pb-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-primary/30">
              <AvatarImage src={profile.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl"><User size={32}/></AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-white">{profile.firstName} {profile.lastName}</h2>
              <p className="text-gray-400">{profile.email}</p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 capitalize">
                {profile.role} Account
              </div>
              {profile.kycStatus === 'approved' && (
                <div className="mt-2 ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 border border-green-500/20 text-green-500">
                  <ShieldCheck size={12} className="mr-1"/> Verified
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">First Name</FormLabel>
                      <FormControl>
                        <Input className="bg-[#0A0A0A] border-white/10 text-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Last Name</FormLabel>
                      <FormControl>
                        <Input className="bg-[#0A0A0A] border-white/10 text-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" className="bg-[#0A0A0A] border-white/10 text-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Country (Optional)</FormLabel>
                      <FormControl>
                        <Input className="bg-[#0A0A0A] border-white/10 text-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={updateMe.isPending} className="bg-gold-gradient text-black font-semibold px-8">
                  {updateMe.isPending ? 'Saving...' : 'Save Changes'} <Save className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
