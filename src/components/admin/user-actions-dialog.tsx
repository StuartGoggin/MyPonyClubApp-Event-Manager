'use client';

import { useState } from 'react';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface UserActionsDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

export function UserActionsDialog({ user, isOpen, onClose, onUserUpdated }: UserActionsDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_user': return 'Super User';
      case 'zone_rep': return 'Zone Rep';
      case 'standard': return 'Standard';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_user': return 'destructive' as const;
      case 'zone_rep': return 'default' as const;
      case 'standard': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const handleRoleChange = async () => {
    if (!selectedRole || selectedRole === user.role) return;

    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/admin/users/role', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'User role updated successfully' });
        onUserUpdated();
        setSelectedRole('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update user role' });
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      setMessage({ type: 'error', text: 'Network error: Failed to update user role' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendCredentials = async () => {
    if (!user.email) {
      setMessage({ type: 'error', text: 'User does not have an email address on file' });
      return;
    }

    try {
      setEmailLoading(true);
      setMessage(null);

      const response = await fetch('/api/admin/users/email-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Credentials email sent successfully to ${data.recipient}` 
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send credentials email' });
      }
    } catch (error) {
      console.error('Error sending credentials email:', error);
      setMessage({ type: 'error', text: 'Network error: Failed to send credentials email' });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleClose = () => {
    setMessage(null);
    setSelectedRole('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Actions</DialogTitle>
          <DialogDescription>
            Manage user roles and send login credentials for {user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.ponyClubId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Card */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pony Club ID:</span>
              <span className="text-sm">{user.ponyClubId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Role:</span>
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {getRoleDisplayName(user.role)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mobile:</span>
              <span className="text-sm font-mono">{user.mobileNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{user.email || 'Not provided'}</span>
            </div>
          </div>

          {/* Success/Error Messages */}
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Role Change Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Change User Role</span>
            </div>
            <div className="flex gap-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="zone_rep">Zone Rep</SelectItem>
                  <SelectItem value="super_user">Super User</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleRoleChange}
                disabled={!selectedRole || selectedRole === user.role || loading}
                size="sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Update'
                )}
              </Button>
            </div>
          </div>

          {/* Email Credentials Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="font-medium">Send Login Credentials</span>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              Send an email with username ({user.ponyClubId}) and password ({user.mobileNumber}) to the user.
            </div>
            <Button
              onClick={handleSendCredentials}
              disabled={!user.email || emailLoading}
              variant="outline"
              className="w-full"
            >
              {emailLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Email...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Credentials Email
                </>
              )}
            </Button>
            {!user.email && (
              <p className="text-sm text-muted-foreground">
                User must have an email address to receive credentials.
              </p>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
