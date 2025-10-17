import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Star,
  ExternalLink,
  MapPin,
  Download,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PendingCandidate {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  resume_url: string | null;
  skills: string[] | null;
  experience_years: string | null;
  education: string | null;
  summary: string | null;
  created_at: string;
  job_post_id: string | null;
  job_posts?: {
    id: string;
    title: string;
    location: string;
  } | null;
}

export default function ReviewCandidatesPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [pendingCandidate, setPendingCandidate] =
    useState<PendingCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const fetchPendingCandidate = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get client ID for current user
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientError) {
        console.error('Error fetching client:', clientError);
        return;
      }

      // Fetch pending review candidate for this client with job post info
      const { data, error } = await supabase
        .from('candidates')
        .select(
          `
          *,
          job_posts (
            id,
            title,
            location
          )
        `
        )
        .eq('client_id', client.id)
        .eq('status', 'pending_review')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - no pending candidates
          setPendingCandidate(null);
        } else {
          throw error;
        }
      } else {
        setPendingCandidate(data);
      }
    } catch (error: any) {
      console.error('Error fetching pending candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending candidate',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchPendingCandidate();
  }, [fetchPendingCandidate]);

  const handleAccept = async () => {
    if (!pendingCandidate) return;

    try {
      setProcessing(true);

      const { error } = await supabase
        .from('candidates')
        .update({ status: 'pending' })
        .eq('id', pendingCandidate.id);

      if (error) throw error;

      toast({
        title: 'Candidate Accepted',
        description: `${pendingCandidate.full_name} has been added to your candidate pool.`,
      });

      setShowAcceptDialog(false);

      // Trigger sidebar count refresh
      window.dispatchEvent(new Event('refreshPendingCount'));

      // Refresh to show next pending candidate
      await fetchPendingCandidate();
    } catch (error: any) {
      console.error('Error accepting candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept candidate',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!pendingCandidate) return;

    try {
      setProcessing(true);

      // Get client information for the email
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, user_id, company_name')
        .eq('user_id', user!.id)
        .single();

      if (clientError) {
        console.error('Error fetching client data:', clientError);
      }

      // Update candidate status to rejected
      const { error } = await supabase
        .from('candidates')
        .update({ status: 'rejected' })
        .eq('id', pendingCandidate.id);

      if (error) throw error;

      // Send resume rejection email alert using profile from AuthContext
      try {
        const { error: emailError } = await supabase.functions.invoke(
          'send-email-alert',
          {
            body: {
              alertType: 'resume_rejection',
              candidateName: pendingCandidate.full_name,
              candidateEmail: pendingCandidate.email || '',
              clientName: profile?.full_name || 'Client',
              companyName: client?.company_name || 'Company',
              dashboardUrl: `${window.location.origin}/dashboard`,
              candidateId: pendingCandidate.id,
              clientId: client?.id,
            },
          }
        );

        if (emailError) {
          console.error('Error sending resume rejection email:', emailError);
          // Don't fail the whole operation if email fails
        }
      } catch (emailError) {
        console.error('Error invoking email alert function:', emailError);
        // Don't fail the whole operation if email fails
      }

      toast({
        title: 'Candidate Rejected',
        description: `${pendingCandidate.full_name} has been declined.`,
      });

      setShowRejectDialog(false);

      // Trigger sidebar count refresh
      window.dispatchEvent(new Event('refreshPendingCount'));

      // Refresh to show next pending candidate
      await fetchPendingCandidate();
    } catch (error: any) {
      console.error('Error rejecting candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject candidate',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!pendingCandidate) return;

    if (!pendingCandidate.resume_url) {
      toast({
        title: 'No Resume Available',
        description: `No resume has been uploaded for ${pendingCandidate.full_name}.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get the public URL from Supabase storage
      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(pendingCandidate.resume_url);

      if (data?.publicUrl) {
        // Open the resume in a new tab
        window.open(data.publicUrl, '_blank');
        toast({
          title: 'Resume Opened',
          description: `Opening resume for ${pendingCandidate.full_name}.`,
        });
      } else {
        throw new Error('Could not generate resume URL');
      }
    } catch (error) {
      console.error('Error opening resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to open resume. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pending candidate...</p>
        </div>
      </div>
    );
  }

  if (!pendingCandidate) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-border bg-card">
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                All Caught Up!
              </h2>
              <p className="text-muted-foreground">
                You have no pending candidates to review at this time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Review Candidate
            </h1>
            <p className="text-muted-foreground">
              A new candidate has been assigned to you for review
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
              disabled={!pendingCandidate.resume_url}
              title={
                pendingCandidate.resume_url
                  ? 'Download Resume'
                  : 'No resume available'
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Download Resume
            </Button>
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800"
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Pending Review
            </Badge>
          </div>
        </div>
      </div>

      <Card className="border-border bg-card mb-6">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <User className="h-5 w-5" />
            Candidate Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header with name */}
          <div className="border-b border-border pb-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {pendingCandidate.full_name}
            </h2>
          </div>

          {/* Position */}
          {pendingCandidate.job_posts && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Briefcase className="h-5 w-5" />
                Position
              </div>
              <p className="text-muted-foreground ml-7">
                {pendingCandidate.job_posts.title}
              </p>
            </div>
          )}

          {/* Location */}
          {(pendingCandidate.location ||
            pendingCandidate.job_posts?.location) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <MapPin className="h-5 w-5" />
                Location
              </div>
              <p className="text-muted-foreground ml-7">
                {pendingCandidate.location ||
                  pendingCandidate.job_posts?.location}
              </p>
            </div>
          )}

          {/* Experience */}
          {pendingCandidate.experience_years !== null && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Briefcase className="h-5 w-5" />
                Experience
              </div>
              <p className="text-muted-foreground ml-7">
                {pendingCandidate.experience_years} years of professional
                experience
              </p>
            </div>
          )}

          {/* Education */}
          {pendingCandidate.education && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <GraduationCap className="h-5 w-5" />
                Education
              </div>
              <p className="text-muted-foreground ml-7">
                {pendingCandidate.education}
              </p>
            </div>
          )}

          {/* Skills */}
          {pendingCandidate.skills && pendingCandidate.skills.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Star className="h-5 w-5" />
                Skills
              </div>
              <div className="flex flex-wrap gap-2 ml-7">
                {pendingCandidate.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {pendingCandidate.summary && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <FileText className="h-5 w-5" />
                Professional Summary
              </div>
              {pendingCandidate.summary.includes('•') ? (
                <ul className="space-y-2 ml-7">
                  {pendingCandidate.summary
                    .split(/•\s*/)
                    .filter(item => item.trim())
                    .map((item, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-muted-foreground leading-relaxed"
                      >
                        <span className="text-primary font-bold">•</span>
                        <span className="flex-1">{item.trim()}</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-muted-foreground ml-7 leading-relaxed">
                  {pendingCandidate.summary}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="border-border bg-card">
        <CardContent className="py-6">
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Would you like to add this candidate to your candidate pool?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowRejectDialog(true)}
                className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={processing}
              >
                <XCircle className="mr-2 h-5 w-5" />
                Reject
              </Button>
              <Button
                size="lg"
                onClick={() => setShowAcceptDialog(true)}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={processing}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Accept
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accept Confirmation Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Accept Candidate?
            </DialogTitle>
            <DialogDescription>
              {pendingCandidate.full_name} will be added to your candidate pool
              and you can proceed with interviews or further evaluation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAcceptDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? 'Processing...' : 'Accept Candidate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Reject Candidate?
            </DialogTitle>
            <DialogDescription>
              {pendingCandidate.full_name} will be declined and will not be
              added to your candidate pool. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing}
              variant="destructive"
            >
              {processing ? 'Processing...' : 'Reject Candidate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
