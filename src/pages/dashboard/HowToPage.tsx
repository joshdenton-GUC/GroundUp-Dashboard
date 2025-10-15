import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const sections: Array<{
  title: string;
  description: string;
  videoUrl?: string;
  steps: string[];
}> = [
  {
    title: 'Post New Job',
    description: 'Create and publish a new job to start receiving candidates.',
    videoUrl:
      'https://wzlqbrglftrkxrfztcqd.supabase.co/storage/v1/object/public/Instruction-videos/job-post.mp4',
    steps: [
      'Go to Post New Job from the sidebar.',
      'Fill in job title, description, and requirements.',
      'Set compensation, location, and employment type.',
      'Click Save in Staging to save the job post as a draft.',
      'Review and click Publish to make it live after payment.',
    ],
  },
  {
    title: 'Manage Jobs',
    description: 'Keep your job listings up to date and organized.',
    videoUrl:
      'https://wzlqbrglftrkxrfztcqd.supabase.co/storage/v1/object/public/Instruction-videos/manage-jobs.mp4',
    steps: [
      'Open Manage Jobs in the sidebar.',
      'Use filters and search to find a job quickly.',
      'You can download and view the PDF of the job post.',
    ],
  },
  {
    title: 'Job Staging',
    description: 'Track each job’s progress through your internal stages.',
    videoUrl:
      'https://wzlqbrglftrkxrfztcqd.supabase.co/storage/v1/object/public/Instruction-videos/job-staging.mp4',
    steps: [
      'Navigate to Job Staging.',
      'You can delete a job post if it is no longer needed.',
      'You can post a job post after payment.When you click on the eye icon, you will be redirected to the payment page.',
    ],
  },
  {
    title: 'Review Candidates',
    description: 'Quickly review, shortlist, or reject candidate applications.',
    videoUrl:
      'https://wzlqbrglftrkxrfztcqd.supabase.co/storage/v1/object/public/Instruction-videos/Review-candidate.mp4',
    steps: [
      'Open Review Candidates from the sidebar.',
      'You can see the candidate details',
      'Use Approve or Reject to update the status of the candidate.',
      'When you approve a candidate, they will be added to your candidate pool.',
      'When you reject a candidate, they will be removed from the review candidates page.',
    ],
  },
  {
    title: 'Manage Candidates',
    description: 'Manage your candidates.',
    videoUrl:
      'https://wzlqbrglftrkxrfztcqd.supabase.co/storage/v1/object/public/Instruction-videos/Review-candidate.mp4',
    steps: [
      'Go to Manage Candidates.',
      'You can see the candidate details',
      'Update the status of the candidate with the action buttons.',
      'After you made a action on the candidate, you can undo it.',
      'When you hire a candidate, they will be added to the Hired Talent page.',
    ],
  },
  {
    title: 'Hired Talent',
    description: 'View confirmed hires.',
    videoUrl: 'https://youtu.be/VIDEO_HIRED_TALENT',
    steps: [
      'Open Hired Talent from the sidebar.',
      'You can see the hired candidates with their probation period.',
    ],
  },
  {
    title: 'Company Profile',
    description: 'Update your organization details and preferences.',
    videoUrl:
      'https://wzlqbrglftrkxrfztcqd.supabase.co/storage/v1/object/public/Instruction-videos/Profile.mp4',
    steps: [
      'Go to Profile in the sidebar.',
      'Update company information and contact details.',
      'Save changes to keep your details current.',
    ],
  },
];

const HowToPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  const isYouTube = useMemo(() => {
    if (!activeUrl) return false;
    return /youtube\.com|youtu\.be/.test(activeUrl);
  }, [activeUrl]);

  const youTubeEmbedUrl = useMemo(() => {
    if (!activeUrl) return null;
    // Extract YouTube video ID from various URL forms
    // Examples: https://youtu.be/ID, https://www.youtube.com/watch?v=ID
    try {
      const url = new URL(activeUrl);
      if (url.hostname.includes('youtu.be')) {
        return `https://www.youtube.com/embed/${url.pathname.replace('/', '')}`;
      }
      if (url.hostname.includes('youtube.com')) {
        const id = url.searchParams.get('v');
        if (id) return `https://www.youtube.com/embed/${id}`;
        // Fallback: if already embed link
        if (url.pathname.startsWith('/embed/')) return activeUrl;
      }
    } catch (_) {
      return null;
    }
    return null;
  }, [activeUrl]);

  const openVideo = (title: string, url: string) => {
    setActiveTitle(title);
    setActiveUrl(url);
    setOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">How To?</h1>
        <p className="text-muted-foreground mt-1">
          Clear, step-by-step guidance for every page. Each section includes a
          quick overview, simple steps, and a video reference.
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map(s => {
          return (
            <Card key={s.title} className="border-zinc-200">
              <CardHeader>
                <CardTitle className="text-base">{s.title}</CardTitle>
                <CardDescription>{s.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal pl-5 space-y-1 text-sm text-zinc-700">
                  {s.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
                {s.videoUrl && (
                  <button
                    type="button"
                    onClick={() => openVideo(s.title, s.videoUrl!)}
                    className="inline-flex text-sm text-orange hover:underline"
                    style={{
                      display: s.title === 'Hired Talent' ? 'none' : 'block',
                    }}
                  >
                    Watch quick video
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>{activeTitle ?? 'Video'}</DialogTitle>
          </DialogHeader>
          <div className="w-full">
            {activeUrl && isYouTube && youTubeEmbedUrl && (
              <div className="aspect-video w-full">
                <iframe
                  src={`${youTubeEmbedUrl}?rel=0&modestbranding=1`}
                  title={activeTitle ?? 'How To Video'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full rounded"
                />
              </div>
            )}
            {activeUrl && !isYouTube && (
              <video
                src={activeUrl}
                controls
                className="w-full rounded"
                playsInline
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HowToPage;
