import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function PaymentStatusHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handlePaymentResult = async () => {
      const paymentIntent = searchParams.get('payment_intent');
      const paymentIntentClientSecret = searchParams.get(
        'payment_intent_client_secret'
      );
      const redirectStatus = searchParams.get('redirect_status');
      console.log(redirectStatus, 'redirectStatus');
      if (!paymentIntent || !paymentIntentClientSecret) {
        setIsProcessing(false);
        return;
      }

      try {
        // Get the payment intent from Stripe to verify the status
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Check the job post status in our database
        const { data: jobPost, error: jobError } = await supabase
          .from('job_posts')
          .select('*')
          .eq('stripe_payment_intent_id', paymentIntent)
          .single();

        if (jobError || !jobPost) {
          throw new Error('Job post not found');
        }

        // Check payment transaction status
        const { data: transaction, error: transactionError } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('stripe_payment_intent_id', paymentIntent)
          .single();

        if (transactionError || !transaction) {
          throw new Error('Payment transaction not found');
        }

        if (
          redirectStatus === 'succeeded' &&
          transaction.status === 'succeeded'
        ) {
          toast({
            title: 'Payment Successful!',
            description: `Your ${jobPost.classification.toLowerCase()} job posting "${
              jobPost.title
            }" has been published successfully.`,
          });
          navigate('/manage-jobs');
        } else if (
          redirectStatus === 'failed' ||
          transaction.status === 'failed'
        ) {
          toast({
            title: 'Payment Failed',
            description:
              transaction.failure_reason ||
              'Your payment could not be processed. Please try again.',
            variant: 'destructive',
          });
          navigate('/post-new-job');
        } else {
          // Payment is still processing
          toast({
            title: 'Payment Processing',
            description:
              "Your payment is being processed. You will be notified once it's complete.",
          });
          navigate('/manage-jobs');
        }
      } catch (error) {
        console.error('Error handling payment result:', error);
        toast({
          title: 'Error',
          description:
            'There was an error processing your payment. Please contact support.',
          variant: 'destructive',
        });
        navigate('/post-new-job');
      } finally {
        setIsProcessing(false);
      }
    };

    handlePaymentResult();
  }, [searchParams, navigate, toast]);

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return null;
}
