import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Search, Eye, Mail, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  user_id: string;
  company_name: string;
  contact_phone: string | null;
  address: string | null;
  street1: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  welcome_email_sent: boolean;
  created_at: string;
  updated_at: string;
  invitation_status?: 'pending' | 'confirmed';
  email_confirmed_at?: string | null;
  profiles?: {
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
  };
}

export function ClientManager() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);

      // Call edge function to get clients with confirmation status
      const { data, error } = await supabase.functions.invoke(
        'get-clients-with-status'
      );

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setClients(data?.clients || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleToggleActive = async (client: Client) => {
    try {
      const newActiveStatus = !client.profiles?.is_active;

      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newActiveStatus })
        .eq('user_id', client.user_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Client ${
          newActiveStatus ? 'activated' : 'deactivated'
        } successfully`,
      });

      // Refresh clients list
      fetchClients();
    } catch (error: any) {
      console.error('Error toggling client status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update client status',
        variant: 'destructive',
      });
    }
  };

  const handleResendInvitation = async (email: string) => {
    try {
      setResendingEmail(email);

      const { data, error } = await supabase.functions.invoke(
        'resend-client-invitation',
        {
          body: { email },
        }
      );

      if (error) {
        console.error('Resend invitation error:', error);

        // Try to parse error message
        let errorMessage = 'Failed to resend invitation';
        try {
          if (error.context?.body) {
            const errorBody =
              typeof error.context.body === 'string'
                ? JSON.parse(error.context.body)
                : error.context.body;

            if (errorBody.error === 'already_confirmed') {
              errorMessage =
                'This client has already confirmed their account and set up their password.';
            } else if (errorBody.message) {
              errorMessage = errorBody.message;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
        } catch (parseError) {
          errorMessage = error.message || errorMessage;
        }

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      if (data?.error) {
        if (data.error === 'already_confirmed') {
          toast({
            title: 'Already Confirmed',
            description:
              'This client has already confirmed their account and set up their password.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: data.message || 'Failed to resend invitation',
            variant: 'destructive',
          });
        }
        return;
      }

      toast({
        title: 'Success',
        description: `Invitation email has been resent to ${email}`,
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend invitation',
        variant: 'destructive',
      });
    } finally {
      setResendingEmail(null);
    }
  };

  const filteredClients = clients.filter(client => {
    // Search filter
    const matchesSearch =
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.profiles?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      client.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && client.profiles?.is_active) ||
      (statusFilter === 'inactive' && !client.profiles?.is_active);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex justify-center p-8">Loading clients...</div>;
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Client Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clients by company name, contact person, or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: 'all' | 'active' | 'inactive') =>
                setStatusFilter(value)
              }
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-background border-border">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clients Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-foreground">Company</TableHead>
                  <TableHead className="text-foreground">
                    Contact Person
                  </TableHead>
                  <TableHead className="text-foreground">
                    Contact Info
                  </TableHead>
                  <TableHead className="text-foreground">Location</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No clients found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map(client => (
                    <TableRow key={client.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">
                        {client.company_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.profiles?.full_name || 'Not available'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="space-y-1">
                          {client.profiles?.email && (
                            <div className="text-sm">
                              {client.profiles.email}
                            </div>
                          )}
                          {client.contact_phone && (
                            <div className="text-sm">
                              {client.contact_phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {client.city && client.state
                          ? `${client.city}, ${client.state}`
                          : client.city || client.state || 'Not specified'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={client.profiles?.is_active ?? true}
                            onCheckedChange={() => handleToggleActive(client)}
                          />
                          <span
                            className={`text-sm ${
                              client.profiles?.is_active
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {client.profiles?.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Only show resend invitation button for pending invitations */}
                          {client.invitation_status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleResendInvitation(
                                  client.profiles?.email || ''
                                )
                              }
                              disabled={
                                !client.profiles?.email ||
                                resendingEmail === client.profiles?.email
                              }
                              title="Resend invitation email"
                            >
                              {resendingEmail === client.profiles?.email ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="text-foreground">
                                  Client Details
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      Company
                                    </h4>
                                    <p className="text-muted-foreground">
                                      {client.company_name}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      Account Status
                                    </h4>
                                    <p
                                      className={`${
                                        client.profiles?.is_active
                                          ? 'text-green-600'
                                          : 'text-red-600'
                                      } font-medium`}
                                    >
                                      {client.profiles?.is_active
                                        ? 'Active'
                                        : 'Inactive'}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      Contact Person
                                    </h4>
                                    <p className="text-muted-foreground">
                                      {client.profiles?.full_name ||
                                        'Not available'}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      Email
                                    </h4>
                                    <p className="text-muted-foreground">
                                      {client.profiles?.email ||
                                        'Not available'}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      Contact Phone
                                    </h4>
                                    <p className="text-muted-foreground">
                                      {client.contact_phone || 'Not provided'}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      Created
                                    </h4>
                                    <p className="text-muted-foreground">
                                      {new Date(
                                        client.created_at
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                {(client.street1 ||
                                  client.city ||
                                  client.state ||
                                  client.zip) && (
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      Address
                                    </h4>
                                    <p className="text-muted-foreground">
                                      {client.street1 && (
                                        <div>{client.street1}</div>
                                      )}
                                      {client.street2 && (
                                        <div>{client.street2}</div>
                                      )}
                                      {(client.city ||
                                        client.state ||
                                        client.zip) && (
                                        <div>
                                          {client.city && `${client.city}`}
                                          {client.city && client.state && ', '}
                                          {client.state && client.state}
                                          {client.zip && ` ${client.zip}`}
                                        </div>
                                      )}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
