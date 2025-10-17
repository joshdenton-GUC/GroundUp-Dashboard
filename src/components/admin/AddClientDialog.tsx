import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface NewClientFormData {
  email: string;
  fullName: string;
  companyName: string;
  contactPhone: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
}

interface AddClientDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddClientDialog({
  trigger,
  open,
  onOpenChange,
  onSuccess,
}: AddClientDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newClientForm, setNewClientForm] = useState<NewClientFormData>({
    email: '',
    fullName: '',
    companyName: '',
    contactPhone: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
  });

  // Use controlled state if provided, otherwise use internal state
  const dialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange || setIsOpen;

  const handleCreateClient = async () => {
    // Validate required fields
    if (
      !newClientForm.email ||
      !newClientForm.fullName ||
      !newClientForm.companyName
    ) {
      toast({
        title: 'Validation Error',
        description:
          'Please fill in all required fields (Email, Full Name, Company Name)',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newClientForm.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);

      // Get the current session for authentication
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to perform this action');
      }

      // Call the edge function to invite the client
      const { data, error } = await supabase.functions.invoke('invite-client', {
        body: {
          email: newClientForm.email,
          fullName: newClientForm.fullName,
          companyName: newClientForm.companyName,
          contactPhone: newClientForm.contactPhone || null,
          street1: newClientForm.street1 || null,
          street2: newClientForm.street2 || null,
          city: newClientForm.city || null,
          state: newClientForm.state || null,
          zip: newClientForm.zip || null,
        },
      });

      if (error) {
        console.error('Edge function error:', error);

        // Try to parse the error context for more details
        // FunctionsHttpError includes the response in context.body
        let errorMessage = 'Failed to create client account';

        try {
          if (error.context?.body) {
            const errorBody =
              typeof error.context.body === 'string'
                ? JSON.parse(error.context.body)
                : error.context.body;

            if (errorBody.message) {
              errorMessage = errorBody.message;
            } else if (errorBody.error) {
              errorMessage = errorBody.error;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
        } catch (parseError) {
          // If parsing fails, use the original error message
          errorMessage = error.message || errorMessage;
        }

        // Handle specific duplicate email errors
        if (
          errorMessage.includes('already registered') ||
          errorMessage.includes('already exists') ||
          errorMessage.includes('duplicate_email')
        ) {
          throw new Error(
            `A user with email "${newClientForm.email}" already exists. Please use a different email address.`
          );
        }

        throw new Error(errorMessage);
      }

      // Check if the response indicates an error (even with 200 status)
      if (data?.error) {
        if (data.error === 'duplicate_email') {
          throw new Error(
            data.message ||
              `A user with email "${newClientForm.email}" already exists. Please use a different email address.`
          );
        }
        throw new Error(data.message || data.error);
      }

      if (!data?.success) {
        throw new Error('Failed to create client account');
      }

      toast({
        title: 'Success',
        description: `Client "${newClientForm.companyName}" has been created. An invitation email has been sent to ${newClientForm.email} to set their password.`,
        duration: 6000,
      });

      // Reset form
      setNewClientForm({
        email: '',
        fullName: '',
        companyName: '',
        contactPhone: '',
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
      });

      // Close dialog
      setDialogOpen(false);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating client:', error);

      // Provide user-friendly error messages
      let errorMessage = 'Failed to create client account';

      if (error.message) {
        errorMessage = error.message;
      } else if (error.error_description) {
        errorMessage = error.error_description;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 8000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleFormChange = (field: keyof NewClientFormData, value: string) => {
    setNewClientForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Client</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new client account with company information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info Message */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> An invitation email will be sent to the
              client with a secure link to set their own password.
            </p>
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Account Information
            </h3>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="client@company.com"
                value={newClientForm.email}
                onChange={e => handleFormChange('email', e.target.value)}
                className="bg-background border-border"
                required
              />
              <p className="text-xs text-muted-foreground">
                The client will receive an invitation email at this address
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Contact Person
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={newClientForm.fullName}
                  onChange={e => handleFormChange('fullName', e.target.value)}
                  className="bg-background border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-foreground">
                  Contact Phone
                </Label>
                <Input
                  id="contactPhone"
                  placeholder="(555) 123-4567"
                  value={newClientForm.contactPhone}
                  onChange={e =>
                    handleFormChange('contactPhone', e.target.value)
                  }
                  className="bg-background border-border"
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Company Information
            </h3>
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-foreground">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="Acme Corporation"
                value={newClientForm.companyName}
                onChange={e => handleFormChange('companyName', e.target.value)}
                className="bg-background border-border"
                required
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Address (Optional)
            </h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="street1" className="text-foreground">
                  Street Address 1
                </Label>
                <Input
                  id="street1"
                  placeholder="123 Main St"
                  value={newClientForm.street1}
                  onChange={e => handleFormChange('street1', e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street2" className="text-foreground">
                  Street Address 2
                </Label>
                <Input
                  id="street2"
                  placeholder="Suite 100"
                  value={newClientForm.street2}
                  onChange={e => handleFormChange('street2', e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-foreground">
                    City
                  </Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={newClientForm.city}
                    onChange={e => handleFormChange('city', e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-foreground">
                    State
                  </Label>
                  <Input
                    id="state"
                    placeholder="NY"
                    value={newClientForm.state}
                    onChange={e => handleFormChange('state', e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip" className="text-foreground">
                    ZIP Code
                  </Label>
                  <Input
                    id="zip"
                    placeholder="10001"
                    value={newClientForm.zip}
                    onChange={e => handleFormChange('zip', e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDialogOpen(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateClient} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Invite Client'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
