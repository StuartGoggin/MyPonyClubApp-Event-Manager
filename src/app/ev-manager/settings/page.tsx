'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  MapPin, 
  Mail, 
  Phone,
  Loader2,
  Image as ImageIcon,
  X,
  User,
  Building,
  Trophy,
  Globe
} from 'lucide-react';

interface EVSettings {
  name: string;
  streetAddress: string;
  imageUrl: string;
  contactName: string;
  contactEmail: string;
  contactMobile: string;
  websiteUrl: string;
}

function EVSettingsContent() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<EVSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Equestrian Victoria',
    streetAddress: '',
    contactName: '',
    contactEmail: '',
    contactMobile: '',
    websiteUrl: 'https://www.vic.equestrian.org.au',
    imageUrl: ''
  });
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only state admins and super users can access EV settings
    if (user?.role !== 'super_user' && user?.role !== 'state_admin') {
      toast({
        title: 'Access Denied',
        description: 'Only state administrators can access Equestrian Victoria settings',
        variant: 'destructive'
      });
      router.push('/ev-manager');
      return;
    }

    fetchEVSettings();
  }, [isAuthenticated, authLoading, user]);

  const fetchEVSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ev-settings');
      if (!response.ok) {
        throw new Error('Failed to fetch EV settings');
      }

      const data = await response.json();
      console.log('EV settings received:', data);
      setSettings(data);
      
      // Get logo - only use if it's a valid base64 data URI
      let logoData = '';
      if (data.imageUrl && data.imageUrl.startsWith('data:image')) {
        logoData = data.imageUrl;
      }
      
      const isValidDataUri = logoData !== '';
      
      // Populate form
      setFormData({
        name: data.name || 'Equestrian Victoria',
        streetAddress: data.streetAddress || '',
        contactName: data.contactName || '',
        contactEmail: data.contactEmail || '',
        contactMobile: data.contactMobile || '',
        websiteUrl: data.websiteUrl || 'https://www.vic.equestrian.org.au',
        imageUrl: isValidDataUri ? logoData : ''
      });

      if (isValidDataUri) {
        console.log('Setting logo preview - valid base64 data URI, length:', logoData.length);
        setLogoPreview(logoData);
      } else {
        console.log('No valid logo data found (not a base64 data URI)');
      }
    } catch (error) {
      console.error('Error fetching EV settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load EV settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 500KB to fit in Firestore field limit)
    // Base64 encoding increases size by ~33%, so 500KB becomes ~667KB, well under 1MB limit
    if (file.size > 500 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 500KB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        console.log('Logo converted to base64, length:', base64String.length);
        
        // Only set if it's a valid data URI
        if (base64String.startsWith('data:image')) {
          setLogoPreview(base64String);
          setFormData(prev => ({ ...prev, imageUrl: base64String }));
          
          toast({
            title: 'Logo Uploaded',
            description: 'Logo preview updated. Click Save to apply changes.'
          });
        } else {
          throw new Error('Invalid image format');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to process logo image',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/ev-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const result = await response.json();
      console.log('Save result:', result);

      toast({
        title: 'Success',
        description: 'Equestrian Victoria settings saved successfully',
      });

      // Refresh settings
      await fetchEVSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/ev-manager')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to EV Manager
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold">Equestrian Victoria Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Configure branding and contact information for Equestrian Victoria
          </p>
        </div>

        {/* Logo Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Organization Logo
            </CardTitle>
            <CardDescription>
              Upload the Equestrian Victoria logo (max 500KB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logoPreview && (
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="EV Logo Preview"
                    className="max-w-xs max-h-32 rounded-lg border-2 border-gray-200 object-contain bg-white p-2"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Recommended: PNG or SVG with transparent background, max 500KB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organization Details
            </CardTitle>
            <CardDescription>
              Basic information about Equestrian Victoria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Equestrian Victoria"
              />
            </div>

            <div>
              <Label htmlFor="streetAddress" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Street Address
              </Label>
              <Textarea
                id="streetAddress"
                value={formData.streetAddress}
                onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                placeholder="Enter street address"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website URL
              </Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                placeholder="https://www.vic.equestrian.org.au"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Primary contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div>
              <Label htmlFor="contactEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                placeholder="contact@vic.equestrian.org.au"
              />
            </div>

            <div>
              <Label htmlFor="contactMobile" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Mobile Number
              </Label>
              <Input
                id="contactMobile"
                type="tel"
                value={formData.contactMobile}
                onChange={(e) => handleInputChange('contactMobile', e.target.value)}
                placeholder="04XX XXX XXX"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/ev-manager')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function EVSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <EVSettingsContent />
    </Suspense>
  );
}
