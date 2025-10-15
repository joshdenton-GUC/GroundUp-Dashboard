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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Search, Eye } from 'lucide-react';

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

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select(
          `
          *,
          profiles:profiles!clients_user_id_fkey (
            email,
            full_name,
            role,
            is_active
          )
        `
        )
        .order('created_at', { ascending: false });
      console.log(data, 'data', error, 'error');
      if (error) throw error;
      setClients(data || []);
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

  const filteredClients = clients.filter(
    client =>
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.profiles?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      client.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search clients by company name, contact person, or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border"
            />
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
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
                                    {client.profiles?.email || 'Not available'}
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
