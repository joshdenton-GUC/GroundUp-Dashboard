import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PaymentModal } from '@/components/ui/payment-modal';
import { useJobHiring } from '@/contexts/JobHiringContext';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  ValidationErrors,
  validateCompanyData,
  validateJobData,
  hasNoValidationErrors,
} from '@/lib/validationUtils';
import { JobClassification } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { triggerNoSaleAlert } from '@/lib/emailAlertTriggers';

type CompanyData = {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
};

type JobData = {
  title: string;
  type: 'full-time' | 'part-time' | 'contract' | 'temporary';
  classification: JobClassification;
  location: string;
  salary: string;
  description: string;
  requirements: string;
  benefits: string;
};

export function PostNewJob() {
  const { addCompany, addJob, saveCompanyTemplate } = useJobHiring();
  const { toast } = useToast();

  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
  });

  const [jobData, setJobData] = useState<JobData>({
    title: '',
    type: 'full-time' as const,
    classification: 'STANDARD' as JobClassification,
    location: '',
    salary: '',
    description: '',
    requirements: '',
    benefits: '',
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [companyErrors, setCompanyErrors] = useState<ValidationErrors>({});
  const [jobErrors, setJobErrors] = useState<ValidationErrors>({});

  // Validation helper functions
  const validateCompanyForm = (): boolean => {
    const errors = validateCompanyData(companyData);
    setCompanyErrors(errors);
    return hasNoValidationErrors(errors);
  };

  const validateJobForm = (): boolean => {
    const errors = validateJobData(jobData);
    setJobErrors(errors);
    return hasNoValidationErrors(errors);
  };

  // Check if company data has content for template saving
  const hasCompanyData =
    companyData.name.trim() !== '' ||
    companyData.email.trim() !== '' ||
    companyData.phone.trim() !== '' ||
    companyData.address.trim() !== '' ||
    companyData.website.trim() !== '' ||
    companyData.description.trim() !== '';

  // Load company template from localStorage or fetch from database
  useEffect(() => {
    const loadCompanyData = async () => {
      // First, try to load from localStorage
      const savedTemplate = localStorage.getItem('companyTemplate');
      if (savedTemplate) {
        try {
          const template = JSON.parse(savedTemplate);
          setCompanyData(template);
          return; // Exit if template found
        } catch (error) {
          console.error('Error loading company template:', error);
        }
      }

      // If no template in localStorage, fetch from database
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch client data
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select(
            'company_name, contact_phone, street1, street2, city, state, zip'
          )
          .eq('user_id', user.id)
          .single();

        // Fetch profile data for email
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', user.id)
          .single();

        if (!clientError && clientData) {
          // Build address from separate fields
          const addressParts = [
            clientData.street1,
            clientData.street2,
            clientData.city,
            clientData.state,
            clientData.zip,
          ].filter(Boolean);

          const address = addressParts.join(', ');

          // Populate company data with database information
          setCompanyData({
            name: clientData.company_name || '',
            phone: clientData.contact_phone || '',
            email: (!profileError && profileData?.email) || '',
            address: address || '',
            website: '', // Not stored in database, only in template
            description: '', // Not stored in database, only in template
          });
        }
      } catch (error) {
        console.error('Error fetching company data from database:', error);
        // Don't show error toast as this is optional fallback behavior
      }
    };

    loadCompanyData();
  }, [toast]);

  const handleSaveCompanyTemplate = () => {
    if (!validateCompanyForm()) {
      toast({
        title: 'Validation Error',
        description:
          'Please fix the validation errors before saving the template.',
        variant: 'destructive',
      });
      return;
    }

    if (!companyData.name) {
      toast({
        title: 'Error',
        description: 'Please enter a company name before saving as template.',
        variant: 'destructive',
      });
      return;
    }

    // Save to localStorage for browser caching
    localStorage.setItem('companyTemplate', JSON.stringify(companyData));

    saveCompanyTemplate(companyData);
    toast({
      title: 'Success',
      description: 'Company information saved as template and cached locally.',
    });
  };

  const handleSaveDraft = async () => {
    const isCompanyValid = validateCompanyForm();
    const isJobValid = validateJobForm();

    if (!isCompanyValid || !isJobValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fix all validation errors before saving draft.',
        variant: 'destructive',
      });
      return;
    }

    if (!companyData.name || !jobData.title) {
      toast({
        title: 'Error',
        description:
          'Please fill in company name and job title before saving draft.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingDraft(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'User not authenticated',
          variant: 'destructive',
        });
        setIsSavingDraft(false);
        return;
      }

      // Get client ID for the current user
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientError || !clientData) {
        toast({
          title: 'Error',
          description: 'Client profile not found',
          variant: 'destructive',
        });
        setIsSavingDraft(false);
        return;
      }

      // Calculate amount based on classification
      const amountCents = jobData.classification === 'PREMIUM' ? 150000 : 50000; // $1500 or $500

      // Insert job post with draft status
      const { data: jobPost, error: jobError } = await supabase
        .from('job_posts')
        .insert({
          client_id: clientData.id,
          title: jobData.title,
          job_type: jobData.type,
          classification: jobData.classification,
          location: jobData.location,
          salary: jobData.salary,
          description: jobData.description,
          requirements: jobData.requirements,
          benefits: jobData.benefits,
          status: 'draft',
          payment_status: 'pending',
          amount_cents: amountCents,
          company_name: companyData.name,
          company_address: companyData.address,
          company_phone: companyData.phone,
          company_email: companyData.email,
          company_website: companyData.website,
          company_description: companyData.description,
        })
        .select()
        .single();

      if (jobError) {
        console.error('Error creating job post:', jobError);
        toast({
          title: 'Error',
          description: 'Failed to save job draft',
          variant: 'destructive',
        });
        setIsSavingDraft(false);
        return;
      }

      toast({
        title: 'Success',
        description: 'Job saved as draft in staging.',
      });

      // Trigger no-sale alert for staged job
      try {
        await triggerNoSaleAlert(jobPost.id);
      } catch (alertError) {
        console.error('Error sending no-sale alert:', alertError);
        // Don't fail the main operation if alert fails
      }

      // Reset form and errors
      setCompanyData({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        description: '',
      });
      setJobData({
        title: '',
        type: 'full-time',
        classification: 'STANDARD',
        location: '',
        salary: '',
        description: '',
        requirements: '',
        benefits: '',
      });
      setCompanyErrors({});
      setJobErrors({});
      setIsSavingDraft(false);
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      setIsSavingDraft(false);
    }
  };

  const handlePostJob = () => {
    const isCompanyValid = validateCompanyForm();
    const isJobValid = validateJobForm();

    if (!isCompanyValid || !isJobValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fix all validation errors before posting the job.',
        variant: 'destructive',
      });
      return;
    }

    if (!companyData.name || !jobData.title) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields before posting job.',
        variant: 'destructive',
      });
      return;
    }

    // Show payment modal instead of directly posting
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    // The job post is already created in the database by the payment intent creation
    // We just need to show success message and reset the form
    toast({
      title: 'Success',
      description: 'Job posted successfully after payment!',
    });

    // Reset form and errors
    setCompanyData({
      name: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      description: '',
    });
    setJobData({
      title: '',
      type: 'full-time',
      classification: 'STANDARD',
      location: '',
      salary: '',
      description: '',
      requirements: '',
      benefits: '',
    });
    setCompanyErrors({});
    setJobErrors({});
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Post New Job
        </h1>
        <p className="text-gray-600">
          Fill out the form below to create a new job posting.
        </p>
      </div>

      <div className="space-y-8">
        {/* Company Information */}
        <Card
          className={`bg-white border border-gray-200 ${
            !hasCompanyData ? 'opacity-60' : ''
          }`}
        >
          <CardHeader
            className={`flex flex-row items-center justify-between ${
              !hasCompanyData ? 'bg-gray-50' : 'bg-gray-800'
            } ${hasCompanyData ? 'text-white' : 'text-gray-500'} rounded-t-lg`}
          >
            <CardTitle
              className={`text-lg font-medium ${
                hasCompanyData ? 'text-white' : 'text-gray-500'
              }`}
            >
              Company Information
            </CardTitle>
            <Button
              onClick={handleSaveCompanyTemplate}
              className={`${
                hasCompanyData
                  ? 'bg-orange text-orange-foreground hover:bg-orange/90 border-orange'
                  : 'bg-orange-light text-orange-light-foreground hover:bg-orange-light/80 border-orange-light'
              }`}
              disabled={!hasCompanyData}
            >
              💾 Save Company Info as Template
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="company-name">Company Name *</Label>
                <Input
                  id="company-name"
                  type="text"
                  placeholder="Enter company name"
                  value={companyData.name}
                  onChange={e => {
                    setCompanyData({ ...companyData, name: e.target.value });
                    if (companyErrors.name) {
                      setCompanyErrors({ ...companyErrors, name: '' });
                    }
                  }}
                  className={cn(
                    companyErrors.name && 'border-red-500 focus:border-red-500'
                  )}
                />
                {companyErrors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {companyErrors.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="company-phone">Phone Number</Label>
                <Input
                  id="company-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={companyData.phone}
                  onChange={e => {
                    setCompanyData({ ...companyData, phone: e.target.value });
                    if (companyErrors.phone) {
                      setCompanyErrors({ ...companyErrors, phone: '' });
                    }
                  }}
                  className={cn(
                    companyErrors.phone && 'border-red-500 focus:border-red-500'
                  )}
                />
                {companyErrors.phone && (
                  <p className="text-sm text-red-500 mt-1">
                    {companyErrors.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="company-email">Email Address</Label>
                <Input
                  id="company-email"
                  type="email"
                  placeholder="contact@company.com"
                  value={companyData.email}
                  onChange={e => {
                    setCompanyData({ ...companyData, email: e.target.value });
                    if (companyErrors.email) {
                      setCompanyErrors({ ...companyErrors, email: '' });
                    }
                  }}
                  className={cn(
                    companyErrors.email && 'border-red-500 focus:border-red-500'
                  )}
                />
                {companyErrors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {companyErrors.email}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="company-website">Website</Label>
                <Input
                  id="company-website"
                  type="url"
                  placeholder="https://www.company.com"
                  value={companyData.website}
                  onChange={e => {
                    setCompanyData({ ...companyData, website: e.target.value });
                    if (companyErrors.website) {
                      setCompanyErrors({ ...companyErrors, website: '' });
                    }
                  }}
                  className={cn(
                    companyErrors.website &&
                      'border-red-500 focus:border-red-500'
                  )}
                />
                {companyErrors.website && (
                  <p className="text-sm text-red-500 mt-1">
                    {companyErrors.website}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="company-address">Company Address</Label>
              <Input
                id="company-address"
                type="text"
                placeholder="123 Main St, City, State 12345"
                value={companyData.address}
                onChange={e => {
                  setCompanyData({ ...companyData, address: e.target.value });
                  if (companyErrors.address) {
                    setCompanyErrors({ ...companyErrors, address: '' });
                  }
                }}
                className={cn(
                  companyErrors.address && 'border-red-500 focus:border-red-500'
                )}
              />
              {companyErrors.address && (
                <p className="text-sm text-red-500 mt-1">
                  {companyErrors.address}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="company-description">Company Description</Label>
              <Textarea
                id="company-description"
                placeholder="Brief description of the company..."
                value={companyData.description}
                onChange={e => {
                  setCompanyData({
                    ...companyData,
                    description: e.target.value,
                  });
                  if (companyErrors.description) {
                    setCompanyErrors({ ...companyErrors, description: '' });
                  }
                }}
                className={cn(
                  companyErrors.description &&
                    'border-red-500 focus:border-red-500'
                )}
              />
              {companyErrors.description && (
                <p className="text-sm text-red-500 mt-1">
                  {companyErrors.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900">
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="job-title">Job Title *</Label>
                <Input
                  id="job-title"
                  type="text"
                  placeholder="e.g., Senior HVAC Technician"
                  value={jobData.title}
                  onChange={e => {
                    setJobData({ ...jobData, title: e.target.value });
                    if (jobErrors.title) {
                      setJobErrors({ ...jobErrors, title: '' });
                    }
                  }}
                  className={cn(
                    jobErrors.title && 'border-red-500 focus:border-red-500'
                  )}
                />
                {jobErrors.title && (
                  <p className="text-sm text-red-500 mt-1">{jobErrors.title}</p>
                )}
              </div>
              <div>
                <Label htmlFor="job-type">Job Type</Label>
                <Select
                  value={jobData.type}
                  onValueChange={(value: JobData['type']) =>
                    setJobData({ ...jobData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="job-classification">Job Classification *</Label>
              <Select
                value={jobData.classification}
                onValueChange={(value: JobClassification) =>
                  setJobData({ ...jobData, classification: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">
                    Standard (Worker/Tradesman) - $500
                  </SelectItem>
                  <SelectItem value="PREMIUM">
                    Premium (Project Manager, Superintendent, Executive) -
                    $1,500
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Choose the appropriate classification for your job posting
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="job-location">Location *</Label>
                <Input
                  id="job-location"
                  type="text"
                  placeholder="City, State"
                  value={jobData.location}
                  onChange={e => {
                    setJobData({ ...jobData, location: e.target.value });
                    if (jobErrors.location) {
                      setJobErrors({ ...jobErrors, location: '' });
                    }
                  }}
                  className={cn(
                    jobErrors.location && 'border-red-500 focus:border-red-500'
                  )}
                />
                {jobErrors.location && (
                  <p className="text-sm text-red-500 mt-1">
                    {jobErrors.location}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="job-salary">Salary Range</Label>
                <Input
                  id="job-salary"
                  type="text"
                  placeholder="e.g., $50,000 - $70,000"
                  value={jobData.salary}
                  onChange={e => {
                    setJobData({ ...jobData, salary: e.target.value });
                    if (jobErrors.salary) {
                      setJobErrors({ ...jobErrors, salary: '' });
                    }
                  }}
                  className={cn(
                    jobErrors.salary && 'border-red-500 focus:border-red-500'
                  )}
                />
                {jobErrors.salary && (
                  <p className="text-sm text-red-500 mt-1">
                    {jobErrors.salary}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="job-description">Job Description *</Label>
              <Textarea
                id="job-description"
                placeholder="Detailed job description..."
                value={jobData.description}
                onChange={e => {
                  setJobData({ ...jobData, description: e.target.value });
                  if (jobErrors.description) {
                    setJobErrors({ ...jobErrors, description: '' });
                  }
                }}
                className={cn(
                  jobErrors.description && 'border-red-500 focus:border-red-500'
                )}
              />
              {jobErrors.description && (
                <p className="text-sm text-red-500 mt-1">
                  {jobErrors.description}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="job-requirements">Requirements *</Label>
              <Textarea
                id="job-requirements"
                placeholder="Required skills, experience, certifications..."
                value={jobData.requirements}
                onChange={e => {
                  setJobData({ ...jobData, requirements: e.target.value });
                  if (jobErrors.requirements) {
                    setJobErrors({ ...jobErrors, requirements: '' });
                  }
                }}
                className={cn(
                  jobErrors.requirements &&
                    'border-red-500 focus:border-red-500'
                )}
              />
              {jobErrors.requirements && (
                <p className="text-sm text-red-500 mt-1">
                  {jobErrors.requirements}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="job-benefits">Benefits & Perks</Label>
              <Textarea
                id="job-benefits"
                placeholder="Health insurance, 401k, vacation..."
                value={jobData.benefits}
                onChange={e =>
                  setJobData({ ...jobData, benefits: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                className="bg-orange text-orange-foreground hover:bg-orange/90 border-orange"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
              >
                {isSavingDraft ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Saving & Sending Alert...
                  </>
                ) : (
                  '📋 Save in Staging'
                )}
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handlePostJob}
                disabled={isSavingDraft}
              >
                📢 Post Job
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        jobTitle={jobData.title}
        companyName={companyData.name}
        jobClassification={jobData.classification}
        jobData={jobData}
        companyData={companyData}
      />
    </div>
  );
}
