import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
} from 'lucide-react';

interface ClientData {
  id: string;
  company_name: string;
  address: string | null;
  street1: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  contact_phone: string | null;
}

interface ProfileData {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'client' | 'user';
  created_at: string;
  updated_at: string;
}

export function CompanyProfile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [dataLoaded, setDataLoaded] = useState({
    client: false,
    profile: false,
  });

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  const fetchClientData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch client data
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (clientError) {
        console.error('Error fetching client data:', clientError);
        toast({
          title: 'Error',
          description: 'Failed to load client data',
          variant: 'destructive',
        });
        return;
      }

      setClientData(client);

      // Populate form fields
      setCompanyName(client.company_name || '');
      setContactPhone(client.contact_phone || '');
      setStreet1(client.street1 || '');
      setStreet2(client.street2 || '');
      setCity(client.city || '');
      setState(client.state || '');
      setZip(client.zip || '');

      setDataLoaded(prev => ({ ...prev, client: true }));
    } catch (error) {
      console.error('Error in fetchClientData:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  const fetchProfileData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile data:', profileError);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
        return;
      }

      setProfileData(profile);

      // Populate form fields
      setEmail(profile?.email || '');
      setFullName(profile?.full_name || '');

      setDataLoaded(prev => ({ ...prev, profile: true }));
    } catch (error) {
      console.error('Error in fetchProfileData:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      setDataLoaded({ client: false, profile: false });
      fetchClientData();
      fetchProfileData();
    }
  }, [user, fetchClientData, fetchProfileData]);

  useEffect(() => {
    if (dataLoaded.client && dataLoaded.profile) {
      setLoading(false);
    }
  }, [dataLoaded]);

  const handleSaveChanges = async () => {
    if (!user || !clientData) return;

    try {
      setSaving(true);

      // Update client data
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          company_name: companyName,
          contact_phone: contactPhone || null,
          street1: street1 || null,
          street2: street2 || null,
          city: city || null,
          state: state || null,
          zip: zip || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientData.id);

      if (clientError) {
        throw clientError;
      }

      // Update profile data (full_name)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) {
        throw profileError;
      }

      toast({
        title: 'Success',
        description: 'Your profile has been updated successfully',
      });

      // Refresh both client and profile data
      await Promise.all([fetchClientData(), fetchProfileData()]);
    } catch (error: any) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#f3f4f6' }}
      >
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-[#ffa708] mx-auto mb-4" />
            <div className="absolute inset-0 h-12 w-12 border-2 border-[#ffa708]/20 rounded-full mx-auto"></div>
          </div>
          <p className="text-gray-900 text-lg font-medium">
            Loading your profile...
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Please wait while we fetch your information
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f3f4f6' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Profile Informations
              </h1>
              <p className="text-gray-600">
                Manage your company information and contact details
              </p>
            </div>
            <Button
              onClick={handleSaveChanges}
              disabled={saving}
              className="bg-[#ffa708] hover:bg-[#e6960a] text-white font-semibold px-8 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Company Information Card */}
          <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-[#ffa708]/10">
                  <Building2 className="h-5 w-5 text-[#ffa708]" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-lg font-semibold">
                    Company Information
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-sm">
                    Basic details about your company
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-gray-900 font-medium">
                  Company Name *
                </Label>
                <Input
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#ffa708] focus:ring-[#ffa708]/20 h-11"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label className="text-gray-900 font-medium flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>Street Address 1</span>
                </Label>
                <Input
                  value={street1}
                  onChange={e => setStreet1(e.target.value)}
                  placeholder="123 Main Street"
                  className="border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#ffa708] focus:ring-[#ffa708]/20 h-11"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-gray-900 font-medium">
                  Street Address 2
                </Label>
                <Input
                  value={street2}
                  onChange={e => setStreet2(e.target.value)}
                  placeholder="Suite 100 (optional)"
                  className="border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#ffa708] focus:ring-[#ffa708]/20 h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-gray-900 font-medium">City</Label>
                  <Input
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="City"
                    className="border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#ffa708] focus:ring-[#ffa708]/20 h-11"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-gray-900 font-medium">State</Label>
                  <Input
                    value={state}
                    onChange={e => setState(e.target.value)}
                    placeholder="State"
                    className="border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#ffa708] focus:ring-[#ffa708]/20 h-11"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-900 font-medium">ZIP Code</Label>
                <Input
                  value={zip}
                  onChange={e => setZip(e.target.value)}
                  placeholder="12345"
                  className="border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#ffa708] focus:ring-[#ffa708]/20 h-11"
                />
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                  💡 This address will be displayed on your job postings
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-[#ffa708]/10">
                  <User className="h-5 w-5 text-[#ffa708]" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-lg font-semibold">
                    Contact Information
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-sm">
                    Primary contact details for job postings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-gray-900 font-medium">Full Name</Label>
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#ffa708] focus:ring-[#ffa708]/20 h-11"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-gray-900 font-medium flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>Email *</span>
                </Label>
                <Input
                  value={email}
                  disabled
                  className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed h-11"
                />
                <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                  🔒 Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-900 font-medium flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>Contact Phone</span>
                </Label>
                <Input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#ffa708] focus:ring-[#ffa708]/20 h-11"
                />
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                  💡 This will be displayed on your job postings
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Details Card */}
          <Card className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200 xl:col-span-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-900 text-lg font-semibold">
                Account Details
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                View your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
                <Label className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                  Account Email
                </Label>
                <p className="text-gray-900 font-medium">
                  {profileData?.email || email || 'N/A'}
                </p>
              </div>

              <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
                <Label className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                  Account Type
                </Label>
                <p className="text-gray-900 font-medium capitalize flex items-center">
                  <span className="w-2 h-2 bg-[#ffa708] rounded-full mr-2"></span>
                  {profileData?.role || 'Client'}
                </p>
              </div>

              <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
                <Label className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                  Member Since
                </Label>
                <p className="text-gray-900 font-medium">
                  {profileData?.created_at
                    ? new Date(profileData.created_at).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )
                    : 'N/A'}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 p-4 bg-gradient-to-r from-[#ffa708]/10 to-[#ffa708]/5 rounded-lg border border-[#ffa708]/20">
                <h4 className="text-gray-900 font-semibold mb-2">
                  Profile Status
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profile Complete</span>
                    <span className="text-[#ffa708] font-medium">
                      {
                        [
                          companyName,
                          fullName,
                          contactPhone,
                          street1,
                          city,
                          state,
                          zip,
                        ].filter(Boolean).length
                      }
                      /7
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#ffa708] h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          ([
                            companyName,
                            fullName,
                            contactPhone,
                            street1,
                            city,
                            state,
                            zip,
                          ].filter(Boolean).length /
                            7) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
