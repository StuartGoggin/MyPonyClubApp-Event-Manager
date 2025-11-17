'use client';

import { useState, useEffect } from 'react';
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
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize selected roles when dialog opens
  useEffect(() => {
    if (user && isOpen) {
      // Use roles array if available, otherwise fall back to single role
      const currentRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
      setSelectedRoles(currentRoles);
    }
  }, [user, isOpen]);

  if (!user) return null;

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_user': return 'Super User';
      case 'state_admin': return 'State Admin';
      case 'zone_rep': return 'Zone Rep';
      case 'club_manager': return 'Club Manager';
      case 'public_holiday_manager': return 'Public Holiday Manager';
      case 'standard': return 'Standard';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_user': return 'destructive' as const;
      case 'state_admin': return 'destructive' as const;
      case 'zone_rep': return 'default' as const;
      case 'club_manager': return 'default' as const;
      case 'public_holiday_manager': return 'secondary' as const;
      case 'standard': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  const handleRoleChange = async () => {
    if (selectedRoles.length === 0) return;

    // Check if roles have actually changed
    const currentRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    const rolesChanged = JSON.stringify([...selectedRoles].sort()) !== JSON.stringify([...currentRoles].sort());
    
    if (!rolesChanged) return;

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
          roles: selectedRoles,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'User roles updated successfully' });
        onUserUpdated();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update user roles' });
      }
    } catch (error) {
      console.error('Error updating user roles:', error);
      setMessage({ type: 'error', text: 'Network error: Failed to update user roles' });
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
    setSelectedRoles([]);
    onClose();
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        // Don't allow removing all roles
        if (prev.length === 1) return prev;
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
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
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Current Roles:</span>
              <div className="flex flex-wrap gap-1">
                {(user.roles && user.roles.length > 0 ? user.roles : [user.role]).map(role => (
                  <Badge key={role} variant={getRoleBadgeVariant(role)}>
                    {getRoleDisplayName(role)}
                  </Badge>
                ))}
              </div>
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
              <span className="font-medium">Change User Roles (select multiple)</span>
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              {['standard', 'club_manager', 'zone_rep', 'state_admin', 'public_holiday_manager', 'super_user'].map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`role-${role}`}
                    checked={selectedRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label
                    htmlFor={`role-${role}`}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {getRoleDisplayName(role)}
                  </label>
                </div>
              ))}
            </div>
            <Button
              onClick={handleRoleChange}
              disabled={selectedRoles.length === 0 || loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Update Roles'
              )}
            </Button>
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
