'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Loader2,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { Club } from '@/lib/types';

function ClubSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clubId = searchParams.get('clubId');
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    physicalAddress: '',
    postalAddress: '',
    socialMediaUrl: '',
    image: ''
  });
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!clubId) {
      toast({
        title: 'Error',
        description: 'No club selected',
        variant: 'destructive'
      });
      router.push('/club-manager');
      return;
    }

    fetchClubData();
  }, [isAuthenticated, authLoading, clubId]);

  const fetchClubData = async () => {
    if (!clubId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/clubs/${clubId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch club data');
      }

      const clubData = await response.json();
      console.log('Club data received:', clubData);
      console.log('Club image field:', clubData.image);
      console.log('Club logoUrl field:', clubData.logoUrl);
      setClub(clubData);
      
      // Get logo from logoUrl first (preferred), then image field
      // Only use if it's a valid base64 data URI - ignore file paths
      let logoData = '';
      if (clubData.logoUrl && clubData.logoUrl.startsWith('data:image')) {
        logoData = clubData.logoUrl;
      } else if (clubData.image && clubData.image.startsWith('data:image')) {
        logoData = clubData.image;
      }
      
      const isValidDataUri = logoData !== '';
      
      // Populate form
      setFormData({
        name: clubData.name || '',
        email: clubData.email || clubData.emailAddress || '',
        phone: clubData.phone || clubData.phoneNumber || '',
        website: clubData.website || clubData.websiteUrl || '',
        physicalAddress: clubData.physicalAddress || '',
        postalAddress: clubData.postalAddress || '',
        socialMediaUrl: clubData.socialMediaUrl || clubData.socialMedia?.facebook || '',
        image: isValidDataUri ? logoData : ''
      });

      if (isValidDataUri) {
        console.log('Setting logo preview - valid base64 data URI, length:', logoData.length);
        setLogoPreview(logoData);
      } else {
        console.log('No valid logo data found (not a base64 data URI):', logoData);
      }
    } catch (error) {
      console.error('Error fetching club data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load club data',
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
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setFormData(prev => ({ ...prev, image: base64String }));
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
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!clubId) return;

    setSaving(true);
    try {
      console.log('Saving club data...', {
        clubId,
        imageLength: formData.image.length,
        hasImage: !!formData.image
      });
      
      const response = await fetch(`/api/clubs/${clubId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          physicalAddress: formData.physicalAddress,
          postalAddress: formData.postalAddress,
          socialMediaUrl: formData.socialMediaUrl,
          image: formData.image
        }),
      });

      console.log('Save response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to update club');
      }

      const result = await response.json();
      console.log('Save result:', result);

      toast({
        title: 'Success',
        description: 'Club information updated successfully',
      });

      // Refresh club data
      await fetchClubData();
    } catch (error) {
      console.error('Error saving club data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save club information',
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
          <p>Loading club settings...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Club not found</p>
            <Button onClick={() => router.push('/club-manager')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Club Manager
            </Button>
          </CardContent>
        </Card>
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
              onClick={() => router.push('/club-manager')}
              className="mb-4 bg-white/90 hover:bg-white text-blue-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Club Manager
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden h-20 w-auto aspect-[16/10] flex items-center justify-center p-2">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Club Logo"
                    className="object-contain w-full h-full drop-shadow-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Club Settings
                </h1>
                <p className="text-blue-100 mt-1">
                  Manage {club.name}'s information and branding
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 max-w-4xl">
        {/* Club Logo */}
        <Card className="bg-white dark:bg-slate-900 shadow-lg border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Club Logo
            </CardTitle>
            <CardDescription>
              Upload your club logo. Recommended size: 500x500px. Max size: 500KB.
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
                      alt="Club Logo"
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
                  aria-label="Upload club logo"
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
              Update your club's basic details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Club Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter club name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="club@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(03) 1234 5678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">
                <Globe className="h-4 w-4 inline mr-2" />
                Website URL
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.yourclub.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialMedia">
                <Globe className="h-4 w-4 inline mr-2" />
                Facebook/Social Media URL
              </Label>
              <Input
                id="socialMedia"
                type="url"
                value={formData.socialMediaUrl}
                onChange={(e) => handleInputChange('socialMediaUrl', e.target.value)}
                placeholder="https://www.facebook.com/yourclub"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card className="bg-white dark:bg-slate-900 shadow-lg border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Information
            </CardTitle>
            <CardDescription>
              Update your club's address details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="physicalAddress">Physical Address</Label>
              <Textarea
                id="physicalAddress"
                value={formData.physicalAddress}
                onChange={(e) => handleInputChange('physicalAddress', e.target.value)}
                placeholder="Enter physical address where events are held"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalAddress">Postal Address</Label>
              <Textarea
                id="postalAddress"
                value={formData.postalAddress}
                onChange={(e) => handleInputChange('postalAddress', e.target.value)}
                placeholder="Enter postal/mailing address"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/club-manager')}
            className="border-slate-300 dark:border-slate-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
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

export default function ClubSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ClubSettingsContent />
    </Suspense>
  );
}
