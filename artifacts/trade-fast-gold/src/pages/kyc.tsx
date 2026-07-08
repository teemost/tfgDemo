import React from 'react';
import { useGetKyc, useSubmitKyc } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Clock, XCircle, AlertTriangle, FileCheck, CheckCircle2 } from 'lucide-react';
import { KycInputDocumentType } from '@workspace/api-client-react/src/generated/api.schemas';

const kycSchema = z.object({
  documentType: z.enum(['passport', 'drivers_license', 'national_id'] as const),
  documentFrontUrl: z.string().url('Must be a valid image URL'),
  documentBackUrl: z.string().url('Must be a valid image URL').optional().or(z.literal('')),
  selfieUrl: z.string().url('Must be a valid image URL'),
  proofOfAddressUrl: z.string().url('Must be a valid image URL').optional().or(z.literal('')),
});

export default function Kyc() {
  const { data: kyc, isLoading, refetch } = useGetKyc();
  const submitKyc = useSubmitKyc();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof kycSchema>>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      documentType: 'passport',
      documentFrontUrl: '',
      documentBackUrl: '',
      selfieUrl: '',
      proofOfAddressUrl: '',
    },
  });

  const onSubmit = (values: z.infer<typeof kycSchema>) => {
    submitKyc.mutate({
      data: {
        documentType: values.documentType as KycInputDocumentType,
        documentFrontUrl: values.documentFrontUrl,
        documentBackUrl: values.documentBackUrl || undefined,
        selfieUrl: values.selfieUrl,
        proofOfAddressUrl: values.proofOfAddressUrl || undefined,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Documents Submitted",
          description: "Your KYC documents have been submitted for review.",
        });
        refetch();
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: error.message || "Failed to submit KYC documents.",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-playfair font-bold text-white mb-6">Identity Verification</h1>
        <Skeleton className="h-64 w-full max-w-2xl bg-white/5 rounded-xl" />
      </div>
    );
  }

  const renderStatusBanner = () => {
    if (!kyc) return null;

    const config = {
      approved: { icon: <CheckCircle2 className="h-6 w-6 text-green-500" />, bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-500', title: 'Verification Successful', desc: 'Your identity has been fully verified. You can now use all platform features.' },
      pending: { icon: <Clock className="h-6 w-6 text-yellow-500" />, bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-500', title: 'Review in Progress', desc: 'Your documents are currently being reviewed by our compliance team. This usually takes 24-48 hours.' },
      rejected: { icon: <XCircle className="h-6 w-6 text-red-500" />, bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-500', title: 'Verification Rejected', desc: `Your verification was rejected: ${kyc.rejectionReason || 'Invalid documents'}. Please resubmit.` },
      resubmit_required: { icon: <AlertTriangle className="h-6 w-6 text-orange-500" />, bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-500', title: 'Action Required', desc: `Please provide clearer documents: ${kyc.rejectionReason || 'Illegible images'}.` },
    };

    // Cast status to known type or fallback to pending
    const statusConfig = config[kyc.status as keyof typeof config] || config.pending;

    return (
      <div className={`p-6 rounded-xl border flex items-start gap-4 mb-8 ${statusConfig.bg}`}>
        <div className="shrink-0 mt-1">{statusConfig.icon}</div>
        <div>
          <h3 className={`text-lg font-bold mb-1 ${statusConfig.text}`}>{statusConfig.title}</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{statusConfig.desc}</p>
        </div>
      </div>
    );
  };

  const showForm = !kyc || kyc.status === 'rejected' || kyc.status === 'resubmit_required';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-white tracking-wide">Identity Verification</h1>
        <p className="text-gray-400 mt-2 max-w-2xl">Complete your KYC to unlock all platform features, including unlimited deposits and withdrawals.</p>
      </div>

      <div className="max-w-3xl">
        {renderStatusBanner()}

        {showForm && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-playfair flex items-center gap-2 text-xl">
                <FileCheck className="text-primary h-5 w-5" /> Submit Documents
              </CardTitle>
              <CardDescription className="text-gray-400">
                Please provide high-quality images hosted on a secure service.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Document Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-white">
                              <SelectValue placeholder="Select document" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#111111] border-white/10 text-white">
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="national_id">National ID Card</SelectItem>
                            <SelectItem value="drivers_license">Driver's License</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="documentFrontUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Document Front (Image URL)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." className="bg-[#0A0A0A] border-white/10 text-white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="documentBackUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Document Back (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." className="bg-[#0A0A0A] border-white/10 text-white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="selfieUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Selfie with Document (Image URL)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." className="bg-[#0A0A0A] border-white/10 text-white" {...field} />
                        </FormControl>
                        <p className="text-xs text-gray-500 mt-1">A clear photo of your face holding the document.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proofOfAddressUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Proof of Address (Optional for Level 1)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." className="bg-[#0A0A0A] border-white/10 text-white" {...field} />
                        </FormControl>
                        <p className="text-xs text-gray-500 mt-1">Utility bill or bank statement (under 3 months old).</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex gap-3 mt-8">
                    <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Your information is encrypted and securely stored. We comply with international data protection laws and will never share your documents with third parties.
                    </p>
                  </div>

                  <Button type="submit" disabled={submitKyc.isPending} className="w-full bg-gold-gradient text-black font-semibold h-12 text-lg">
                    {submitKyc.isPending ? 'Submitting...' : 'Submit Verification'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
