-- Create job_posts table
CREATE TABLE public.job_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('full-time', 'part-time', 'contract', 'temporary')),
  classification TEXT NOT NULL CHECK (classification IN ('STANDARD', 'PREMIUM')),
  location TEXT NOT NULL,
  salary TEXT,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  benefits TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_payment', 'posted', 'filled', 'paused', 'canceled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  stripe_price_id TEXT,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  posted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create payment_transactions table for tracking payments
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_post_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  stripe_charge_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'requires_action')),
  payment_method TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on job_posts
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for job_posts
CREATE POLICY "Clients can view their own job posts" 
ON public.job_posts 
FOR SELECT 
USING (client_id IN (
  SELECT id FROM public.clients WHERE user_id = auth.uid()
));

CREATE POLICY "Clients can insert their own job posts" 
ON public.job_posts 
FOR INSERT 
WITH CHECK (client_id IN (
  SELECT id FROM public.clients WHERE user_id = auth.uid()
));

CREATE POLICY "Clients can update their own job posts" 
ON public.job_posts 
FOR UPDATE 
USING (client_id IN (
  SELECT id FROM public.clients WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all job posts" 
ON public.job_posts 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

CREATE POLICY "Admins can update all job posts" 
ON public.job_posts 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- Policies for payment_transactions
CREATE POLICY "Clients can view their own payment transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (job_post_id IN (
  SELECT id FROM public.job_posts WHERE client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Admins can view all payment transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- System can insert payment transactions (for webhook processing)
CREATE POLICY "System can insert payment transactions" 
ON public.payment_transactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update payment transactions" 
ON public.payment_transactions 
FOR UPDATE 
WITH CHECK (true);

-- Create indexes for efficient querying
CREATE INDEX idx_job_posts_client_id ON public.job_posts(client_id);
CREATE INDEX idx_job_posts_status ON public.job_posts(status);
CREATE INDEX idx_job_posts_payment_status ON public.job_posts(payment_status);
CREATE INDEX idx_job_posts_created_at ON public.job_posts(created_at DESC);
CREATE INDEX idx_job_posts_posted_at ON public.job_posts(posted_at DESC);

CREATE INDEX idx_payment_transactions_job_post_id ON public.payment_transactions(job_post_id);
CREATE INDEX idx_payment_transactions_stripe_payment_intent_id ON public.payment_transactions(stripe_payment_intent_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_job_posts_updated_at 
    BEFORE UPDATE ON public.job_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at 
    BEFORE UPDATE ON public.payment_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to set job post expiration (30 days from posting)
CREATE OR REPLACE FUNCTION set_job_post_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'posted' AND OLD.status != 'posted' THEN
        NEW.posted_at = now();
        NEW.expires_at = now() + INTERVAL '30 days';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for job post expiration
CREATE TRIGGER set_job_post_expiration_trigger
    BEFORE UPDATE ON public.job_posts
    FOR EACH ROW EXECUTE FUNCTION set_job_post_expiration();
