'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
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
  Building
} from 'lucide-react';

interface StateSettings {
  name: string;
  streetAddress: string;
  imageUrl: string;
  contactName: string;
  contactEmail: string;
  contactMobile: string;
  websiteUrl: string;
}

function StateSettingsContent() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<StateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Victoria',
    streetAddress: '',
    contactName: '',
    contactEmail: '',
    contactMobile: '',
    websiteUrl: '',
    imageUrl: ''
  });
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [initialLogoPreview, setInitialLogoPreview] = useState<string>('');

  const fetchStateSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/state-settings');
      if (!response.ok) {
        throw new Error('Failed to fetch state settings');
      }

      const data = await response.json();
      console.log('State settings received:', data);
      setSettings(data);
      
      // Get logo - only use if it's a valid base64 data URI
      let logoData = '';
      if (data.imageUrl && data.imageUrl.startsWith('data:image')) {
        logoData = data.imageUrl;
      }
      
      const isValidDataUri = logoData !== '';
      
      // Populate form
      setFormData({
        name: data.name || 'Victoria',
        streetAddress: data.streetAddress || '',
        contactName: data.contactName || '',
        contactEmail: data.contactEmail || '',
        contactMobile: data.contactMobile || '',
        websiteUrl: data.websiteUrl || '',
        imageUrl: isValidDataUri ? logoData : ''
      });

      if (isValidDataUri) {
        console.log('Setting logo preview - valid base64 data URI, length:', logoData.length);
        setLogoPreview(logoData);
        setInitialLogoPreview(logoData);
      } else {
        console.log('No valid logo data found (not a base64 data URI)');
      }
    } catch (error) {
      console.error('Error fetching state settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load state settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only super users can access state settings
    if (user?.role !== 'super_user') {
      toast({
        title: 'Access Denied',
        description: 'Only super users can access state settings',
        variant: 'destructive'
      });
      router.push('/state-manager');
      return;
    }

    fetchStateSettings();
  }, [isAuthenticated, authLoading, user, router, toast, fetchStateSettings]);

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
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setFormData(prev => ({ ...prev, imageUrl: base64String }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload logo',
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
      console.log('Saving state settings...', {
        imageLength: formData.imageUrl.length,
        hasImage: !!formData.imageUrl
      });
      
      const response = await fetch('/api/state-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Save response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to update state settings');
      }

      const result = await response.json();
      console.log('Save result:', result);

      toast({
        title: 'Success',
        description: 'State settings updated successfully',
      });

      // Refresh settings data
      await fetchStateSettings();
    } catch (error) {
      console.error('Error saving state settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save state settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading state settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Modern Header */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-900 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
          <div className="relative">
            <Button
              variant="secondary"
              onClick={() => router.push('/state-manager')}
              className="mb-4 bg-white/90 hover:bg-white text-blue-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to State Manager
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden h-20 w-auto aspect-[16/10] flex items-center justify-center p-2">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="State Logo"
                    className="object-contain w-full h-full drop-shadow-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  State Settings
                </h1>
                <p className="text-blue-100 mt-1">
                  Manage state-level information and branding
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 max-w-4xl">
        {/* State Logo */}
        <Card className="bg-white dark:bg-slate-900 shadow-lg border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              State Logo
            </CardTitle>
            <CardDescription>
              Upload the state logo. Recommended size: 500x500px. Max size: 500KB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Logo Preview */}
              <div className="relative">
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden bg-muted/20 flex items-center justify-center">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt="State Logo"
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                  )}
                </div>
                {logoPreview && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  aria-label="Upload state logo"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, GIF, SVG
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="bg-white dark:bg-slate-900 shadow-lg border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              State-level details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">State Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter state name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="streetAddress">
                <MapPin className="h-4 w-4 inline mr-2" />
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

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                value={formData.websiteUrl}
                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              State contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                placeholder="Enter contact name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email Address
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactMobile">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Mobile Number
                </Label>
                <Input
                  id="contactMobile"
                  type="tel"
                  value={formData.contactMobile}
                  onChange={(e) => handleInputChange('contactMobile', e.target.value)}
                  placeholder="0400 000 000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/state-manager')}
            className="border-slate-300 dark:border-slate-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[120px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function StateSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <StateSettingsContent />
    </Suspense>
  );
}
