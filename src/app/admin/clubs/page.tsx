'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Users, MapPin, Globe, Mail, Image, Loader2 } from 'lucide-react';
import { Zone, Club } from '@/lib/types';
import { validateClubData, ValidationErrors, formatAddress } from '@/lib/validation';

export default function AdminClubsPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clubToDelete, setClubToDelete] = useState<Club | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState({ 
    // Basic Info
    name: '', 
    zoneId: '', 
    latitude: '', 
    longitude: '',
    // Address
    street: '',
    suburb: '',
    postcode: '',
    state: 'VIC',
    country: 'Australia',
    // Contact & Communication
    email: '',
    website: '',
    // Social Media
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    // Branding
    logoUrl: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch zones and clubs from Firestore
      const [zonesResponse, clubsResponse] = await Promise.all([
        fetch('/api/zones'),
        fetch('/api/clubs')
      ]);

      if (!zonesResponse.ok || !clubsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const zonesData = await zonesResponse.json();
      const clubsData = await clubsResponse.json();

      setZones(Array.isArray(zonesData) ? zonesData : (zonesData.zones || []));
      setClubs(Array.isArray(clubsData) ? clubsData : (clubsData.clubs || []));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load club data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetFormData = () => ({
    name: '', 
    zoneId: '', 
    latitude: '', 
    longitude: '',
    street: '',
    suburb: '',
    postcode: '',
    state: 'VIC',
    country: 'Australia',
    email: '',
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    logoUrl: ''
  });

  const getZoneName = (zoneId: string) => {
    return zones.find(zone => zone.id === zoneId)?.name || 'Unknown Zone';
  };

  const getClubsByZone = (zoneId: string) => {
    return clubs.filter(club => club.zoneId === zoneId);
  };

  const handleCreate = () => {
    setEditingClub(null);
    setFormData(resetFormData());
    setValidationErrors({});
    setIsDialogOpen(true);
  };

  const handleEdit = (club: Club) => {
    setEditingClub(club);
    setFormData({ 
      name: club.name,
      zoneId: club.zoneId,
      latitude: club.latitude?.toString() || '',
      longitude: club.longitude?.toString() || '',
      street: club.address?.street || '',
      suburb: club.address?.suburb || '',
      postcode: club.address?.postcode || '',
      state: club.address?.state || 'VIC',
      country: club.address?.country || 'Australia',
      email: club.email || '',
      website: club.website || '',
      facebook: club.socialMedia?.facebook || '',
      instagram: club.socialMedia?.instagram || '',
      twitter: club.socialMedia?.twitter || '',
      youtube: club.socialMedia?.youtube || '',
      logoUrl: club.logoUrl || ''
    });
    setValidationErrors({});
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.zoneId) return;

    // Validate form data
    const validationData = {
      email: formData.email,
      website: formData.website,
      logoUrl: formData.logoUrl,
      socialMedia: {
        facebook: formData.facebook,
        instagram: formData.instagram,
        twitter: formData.twitter,
        youtube: formData.youtube,
      },
      address: {
        postcode: formData.postcode
      }
    };

    const errors = validateClubData(validationData);
    setValidationErrors(errors);

    // Don't save if there are validation errors
    if (Object.keys(errors).length > 0) {
      return;
    }

    const clubData: Omit<Club, 'id'> = {
      name: formData.name.trim(),
      zoneId: formData.zoneId,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      address: {
        street: formData.street || undefined,
        suburb: formData.suburb || undefined,
        postcode: formData.postcode || undefined,
        state: formData.state || undefined,
        country: formData.country || undefined,
      },
      email: formData.email || undefined,
      website: formData.website || undefined,
      socialMedia: {
        facebook: formData.facebook || undefined,
        instagram: formData.instagram || undefined,
        twitter: formData.twitter || undefined,
        youtube: formData.youtube || undefined,
      },
      logoUrl: formData.logoUrl || undefined,
    };

    // Clean up empty objects
    if (clubData.address && !Object.values(clubData.address).some(v => v)) {
      delete clubData.address;
    }
    if (clubData.socialMedia && !Object.values(clubData.socialMedia).some(v => v)) {
      delete clubData.socialMedia;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      if (editingClub) {
        // Update existing club
        const response = await fetch('/api/clubs', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: editingClub.id, ...clubData }),
        });

        if (!response.ok) {
          throw new Error('Failed to update club');
        }

        const updatedClub = await response.json();
        setClubs(prev => prev.map(club => 
          club.id === editingClub.id ? updatedClub : club
        ));
      } else {
        // Create new club
        const response = await fetch('/api/clubs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clubData),
        });

        if (!response.ok) {
          throw new Error('Failed to create club');
        }

        const newClub = await response.json();
        setClubs(prev => [...prev, newClub]);
      }

      setIsDialogOpen(false);
      setEditingClub(null);
      setFormData(resetFormData());
      setValidationErrors({});
    } catch (error) {
      console.error('Error saving club:', error);
      setError('Failed to save club. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (club: Club) => {
    setClubToDelete(club);
    setDeleteConfirmText('');
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!clubToDelete || deleteConfirmText !== clubToDelete.name) {
      return;
    }

    setIsDeleting(true);
    try {
      // In a real app, you'd make an API call to delete from Firestore
      // and also check if the club has any associated events
      setClubs(prev => prev.filter(c => c.id !== clubToDelete.id));
      
      setIsDeleteDialogOpen(false);
      setClubToDelete(null);
      setDeleteConfirmText('');
    } catch (error) {
      console.error('Error deleting club:', error);
      // Handle error appropriately
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setClubToDelete(null);
    setDeleteConfirmText('');
  };

  return (
    <div className="space-y-6">
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>Loading club data...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={fetchData}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!loading && !error && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Club Management</h1>
              <p className="text-muted-foreground">
                Manage pony clubs and their zone assignments
              </p>
            </div>
            <Button onClick={handleCreate} disabled={zones.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Club
            </Button>
          </div>

      {zones.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">No Zones Configured</p>
                <p className="text-sm text-amber-700">
                  You need to create zones before you can add clubs. 
                  <Button variant="link" className="h-auto p-0 text-amber-700 underline">
                    Go to Zone Management
                  </Button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clubs</p>
                <p className="text-2xl font-bold">{clubs.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Coordinates</p>
                <p className="text-2xl font-bold">
                  {clubs.filter(c => c.latitude && c.longitude).length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Zones</p>
                <p className="text-2xl font-bold">
                  {zones.filter(z => getClubsByZone(z.id).length > 0).length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clubs by Zone */}
      {zones.map(zone => {
        const zoneClubs = getClubsByZone(zone.id);
        return (
          <Card key={zone.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {zone.name}
                <Badge variant="secondary">{zoneClubs.length} clubs</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {zoneClubs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Club Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Coordinates</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zoneClubs.map(club => (
                      <TableRow key={club.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {club.logoUrl && (
                              <img 
                                src={club.logoUrl} 
                                alt={`${club.name} logo`}
                                className="w-8 h-8 rounded object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div>
                              <div>{club.name}</div>
                              {club.website && (
                                <a 
                                  href={club.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <Globe className="h-3 w-3" />
                                  Website
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {club.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <a href={`mailto:${club.email}`} className="text-blue-600 hover:underline">
                                  {club.email}
                                </a>
                              </div>
                            )}
                            <div className="flex gap-1">
                              {club.socialMedia?.facebook && (
                                <a href={club.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                                  <Badge variant="outline" className="text-xs">FB</Badge>
                                </a>
                              )}
                              {club.socialMedia?.instagram && (
                                <a href={club.socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                                  <Badge variant="outline" className="text-xs">IG</Badge>
                                </a>
                              )}
                              {club.socialMedia?.twitter && (
                                <a href={club.socialMedia.twitter} target="_blank" rel="noopener noreferrer">
                                  <Badge variant="outline" className="text-xs">X</Badge>
                                </a>
                              )}
                              {club.socialMedia?.youtube && (
                                <a href={club.socialMedia.youtube} target="_blank" rel="noopener noreferrer">
                                  <Badge variant="outline" className="text-xs">YT</Badge>
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {club.address && (
                            <div className="text-sm">
                              {formatAddress(club.address)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {club.latitude && club.longitude ? (
                            <Badge variant="outline" className="text-xs">
                              {club.latitude.toFixed(4)}, {club.longitude.toFixed(4)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not set</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(club)}
                              title="Edit club details"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(club)}
                              title="Delete club (requires confirmation)"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No clubs in this zone yet.
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClub ? 'Edit Club' : 'Add New Club'}
            </DialogTitle>
            <DialogDescription>
              {editingClub 
                ? 'Update the club details below.'
                : 'Enter the details for the new club.'
              }
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="social">Social & Branding</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Club Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Melbourne Pony Club"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="zone">Zone *</Label>
                <Select value={formData.zoneId} onValueChange={(value) => setFormData(prev => ({ ...prev, zoneId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map(zone => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude (optional)</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="-37.8136"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude (optional)</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="144.9631"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  placeholder="e.g., 123 Horse Lane"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="suburb">Suburb</Label>
                  <Input
                    id="suburb"
                    placeholder="e.g., Bundoora"
                    value={formData.suburb}
                    onChange={(e) => setFormData(prev => ({ ...prev, suburb: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    placeholder="e.g., 3083"
                    value={formData.postcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postcode: e.target.value }))}
                  />
                  {validationErrors.postcode && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.postcode}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIC">Victoria</SelectItem>
                      <SelectItem value="NSW">New South Wales</SelectItem>
                      <SelectItem value="QLD">Queensland</SelectItem>
                      <SelectItem value="SA">South Australia</SelectItem>
                      <SelectItem value="WA">Western Australia</SelectItem>
                      <SelectItem value="TAS">Tasmania</SelectItem>
                      <SelectItem value="NT">Northern Territory</SelectItem>
                      <SelectItem value="ACT">Australian Capital Territory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="e.g., Australia"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="email">Club Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g., info@melbourneponyclub.com.au"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    type="url"
                    placeholder="e.g., https://www.melbourneponyclub.com.au"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                {validationErrors.website && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.website}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="logoUrl">Club Logo URL</Label>
                <div className="relative">
                  <Image className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="logoUrl"
                    type="url"
                    placeholder="e.g., https://example.com/logo.png"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                {validationErrors.logoUrl && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.logoUrl}</p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label>Social Media Links</Label>
                
                <div>
                  <Label htmlFor="facebook" className="text-sm">Facebook</Label>
                  <Input
                    id="facebook"
                    placeholder="e.g., https://facebook.com/melbourneponyclub"
                    value={formData.facebook}
                    onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                  />
                  {validationErrors.facebook && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.facebook}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="instagram" className="text-sm">Instagram</Label>
                  <Input
                    id="instagram"
                    placeholder="e.g., https://instagram.com/melbourneponyclub"
                    value={formData.instagram}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                  />
                  {validationErrors.instagram && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.instagram}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="twitter" className="text-sm">Twitter</Label>
                  <Input
                    id="twitter"
                    placeholder="e.g., https://twitter.com/melbourneponyclub"
                    value={formData.twitter}
                    onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                  />
                  {validationErrors.twitter && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.twitter}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="youtube" className="text-sm">YouTube</Label>
                  <Input
                    id="youtube"
                    placeholder="e.g., https://youtube.com/@melbourneponyclub"
                    value={formData.youtube}
                    onChange={(e) => setFormData(prev => ({ ...prev, youtube: e.target.value }))}
                  />
                  {validationErrors.youtube && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.youtube}</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                Please fix the validation errors above before saving.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.name.trim() || !formData.zoneId || Object.keys(validationErrors).length > 0 || isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingClub ? 'Update Club' : 'Create Club'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Club
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the club and all associated data.
            </DialogDescription>
          </DialogHeader>

          {clubToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{clubToDelete.name}</span>
                </div>
                <div className="text-sm text-red-700 mt-1">
                  Zone: {getZoneName(clubToDelete.zoneId)}
                </div>
                {clubToDelete.email && (
                  <div className="text-sm text-red-700">
                    Contact: {clubToDelete.email}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deleteConfirm" className="text-sm font-medium">
                  To confirm deletion, type the club name exactly as shown above:
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={`Type "${clubToDelete.name}" to confirm`}
                  className={`${
                    deleteConfirmText && deleteConfirmText !== clubToDelete.name 
                      ? 'border-red-300 focus:border-red-500' 
                      : ''
                  }`}
                />
                {deleteConfirmText && deleteConfirmText !== clubToDelete.name && (
                  <p className="text-sm text-red-600">
                    Club name does not match. Please type exactly: &ldquo;{clubToDelete.name}&rdquo;
                  </p>
                )}
              </div>

              <Alert variant="destructive">
                <AlertDescription className="text-sm">
                  <strong>Warning:</strong> In a production environment, you should also check if this club has any associated events before allowing deletion.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!clubToDelete || deleteConfirmText !== clubToDelete.name || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Club
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}
