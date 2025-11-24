'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Plus, Edit, Trash2, Check, X, Calendar, DollarSign, AlertCircle, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { EquipmentItem, EquipmentBooking, PricingRule } from '@/types/equipment';

interface ZoneEquipmentDashboardProps {
  zoneId: string;
  zoneName: string;
}

export function ZoneEquipmentDashboard({ zoneId, zoneName }: ZoneEquipmentDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Inventory state
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | null>(null);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  
  // Bookings state
  const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<EquipmentBooking | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  
  // Pricing rules state
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(true);

  // Equipment form state
  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    category: '',
    description: '',
    icon: '',
    hirePrice: 0,
    depositRequired: 0,
    bondAmount: 0,
    quantity: 1,
    status: 'available' as const,
    pricingType: 'per_day' as 'per_day' | 'flat_fee',
  });

  // Fetch data
  useEffect(() => {
    if (activeTab === 'inventory') fetchEquipment();
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'pricing') fetchPricingRules();
  }, [activeTab, zoneId]);

  const fetchEquipment = async () => {
    try {
      setLoadingEquipment(true);
      const response = await fetch(`/api/equipment?zoneId=${zoneId}`);
      if (!response.ok) throw new Error('Failed to fetch equipment');
      const data = await response.json();
      setEquipment(data.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load equipment',
        variant: 'destructive',
      });
    } finally {
      setLoadingEquipment(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const response = await fetch(`/api/equipment-bookings?zoneId=${zoneId}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      setBookings(data.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive',
      });
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchPricingRules = async () => {
    try {
      setLoadingPricing(true);
      const response = await fetch(`/api/equipment-pricing-rules?zoneId=${zoneId}`);
      if (!response.ok) throw new Error('Failed to fetch pricing rules');
      const data = await response.json();
      setPricingRules(data.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load pricing rules',
        variant: 'destructive',
      });
    } finally {
      setLoadingPricing(false);
    }
  };

  // Equipment CRUD
  const handleAddEquipment = () => {
    setEditingEquipment(null);
    setEquipmentForm({
      name: '',
      category: '',
      description: '',
      icon: '',
      hirePrice: 0,
      depositRequired: 0,
      bondAmount: 0,
      quantity: 1,
      status: 'available' as const,
      pricingType: 'per_day' as 'per_day' | 'flat_fee',
    });
    setEquipmentDialogOpen(true);
  };

  const handleEditEquipment = (item: EquipmentItem) => {
    setEditingEquipment(item);
    setEquipmentForm({
      name: item.name,
      category: item.category,
      description: item.description || '',
      icon: item.icon || '',
      hirePrice: item.basePricePerDay, // Use basePricePerDay as hirePrice for backward compatibility
      depositRequired: item.depositRequired,
      bondAmount: item.bondAmount || 0,
      quantity: item.quantity || 1,
      status: (item.status || item.availability || 'available') as 'available',
      pricingType: (item.pricingType || 'per_day') as 'per_day' | 'flat_fee',
    });
    setEquipmentDialogOpen(true);
  };

  const handleSaveEquipment = async () => {
    try {
      const url = editingEquipment 
        ? `/api/equipment/${editingEquipment.id}`
        : '/api/equipment';
      
      const method = editingEquipment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...equipmentForm,
          zoneId,
          zoneName,
        }),
      });

      if (!response.ok) throw new Error('Failed to save equipment');

      toast({
        title: 'Success',
        description: `Equipment ${editingEquipment ? 'updated' : 'created'} successfully`,
      });

      setEquipmentDialogOpen(false);
      fetchEquipment();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save equipment',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;

    try {
      const response = await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete equipment');

      toast({
        title: 'Success',
        description: 'Equipment deleted successfully',
      });

      fetchEquipment();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete equipment',
        variant: 'destructive',
      });
    }
  };

  // Booking actions
  const handleApproveBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/equipment-bookings/${bookingId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to approve booking');

      toast({
        title: 'Success',
        description: 'Booking approved successfully',
      });

      fetchBookings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve booking',
        variant: 'destructive',
      });
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/equipment-bookings/${bookingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      if (!response.ok) throw new Error('Failed to reject booking');

      toast({
        title: 'Success',
        description: 'Booking rejected',
      });

      fetchBookings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject booking',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Equipment Management</h2>
        <p className="text-muted-foreground">
          Manage equipment inventory, bookings, and pricing for {zoneName}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Rules</TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {equipment.length} equipment item{equipment.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={handleAddEquipment}>
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price/Day</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingEquipment ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : equipment.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No equipment found. Add your first item to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  equipment.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'available' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        ${item.basePricePerDay}
                        {item.pricingType === 'flat_fee' ? '/event' : '/day'}
                      </TableCell>
                      <TableCell>{item.quantity || 1}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEquipment(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEquipment(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </p>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingBookings ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => {
                    const pickupDate = booking.pickupDate ? new Date(booking.pickupDate) : null;
                    const returnDate = booking.returnDate ? new Date(booking.returnDate) : null;
                    const isValidPickup = pickupDate && !isNaN(pickupDate.getTime());
                    const isValidReturn = returnDate && !isNaN(returnDate.getTime());
                    
                    return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.equipmentName}</TableCell>
                      <TableCell>{booking.clubName}</TableCell>
                      <TableCell className="text-muted-foreground">{booking.eventName || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {isValidPickup && isValidReturn ? (
                          `${format(pickupDate, 'MMM d')} - ${format(returnDate, 'MMM d, yyyy')}`
                        ) : (
                          'Invalid date'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveBooking(booking.id)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectBooking(booking.id)}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setBookingDialogOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Pricing Rules Tab */}
        <TabsContent value="pricing" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Custom pricing rules for equipment and clubs
          </p>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Pricing rules management coming soon. Default pricing is set per equipment item.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Equipment Dialog */}
      <Dialog open={equipmentDialogOpen} onOpenChange={setEquipmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
            </DialogTitle>
            <DialogDescription>
              {editingEquipment ? 'Update equipment details' : 'Add new equipment to your zone inventory'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={equipmentForm.name}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={equipmentForm.category}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, category: e.target.value })}
                placeholder="e.g., Arena Equipment, Safety Gear"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={equipmentForm.description}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                value={equipmentForm.icon}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, icon: e.target.value })}
                placeholder="e.g., 🏇 🎪 🚚 🎤 ⛺"
                maxLength={4}
              />
              <p className="text-sm text-muted-foreground">Choose an emoji to represent this equipment on the calendar</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hirePrice">Hire Price ($)</Label>
              <Input
                id="hirePrice"
                type="number"
                min="0"
                step="0.01"
                value={equipmentForm.hirePrice}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, hirePrice: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricingType">Pricing Type</Label>
              <Select
                value={equipmentForm.pricingType}
                onValueChange={(value: 'per_day' | 'flat_fee') => setEquipmentForm({ ...equipmentForm, pricingType: value })}
              >
                <SelectTrigger id="pricingType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_day">Per Day</SelectItem>
                  <SelectItem value="flat_fee">Per Event (Flat Fee)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {equipmentForm.pricingType === 'flat_fee' 
                  ? 'Flat fee charged per event regardless of duration' 
                  : 'Price charged per day of use'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={equipmentForm.quantity}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit">Deposit Required ($)</Label>
                <Input
                  id="deposit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={equipmentForm.depositRequired}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, depositRequired: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bond">Bond Amount ($)</Label>
                <Input
                  id="bond"
                  type="number"
                  min="0"
                  step="0.01"
                  value={equipmentForm.bondAmount}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, bondAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={equipmentForm.status}
                onValueChange={(value: any) => setEquipmentForm({ ...equipmentForm, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEquipmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEquipment}>
              {editingEquipment ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Equipment</Label>
                  <p className="font-medium">{selectedBooking.equipmentName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedBooking.status)}>
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Club</Label>
                  <p>{selectedBooking.clubName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Custodian</Label>
                  <p>{selectedBooking.custodian.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.custodian.email}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Event</Label>
                <p className="font-medium">{selectedBooking.eventName || 'Not linked to event'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Pickup Date</Label>
                  <p>
                    {selectedBooking.pickupDate && !isNaN(new Date(selectedBooking.pickupDate).getTime())
                      ? format(new Date(selectedBooking.pickupDate), 'PPP')
                      : 'Invalid date'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Return Date</Label>
                  <p>
                    {selectedBooking.returnDate && !isNaN(new Date(selectedBooking.returnDate).getTime())
                      ? format(new Date(selectedBooking.returnDate), 'PPP')
                      : 'Invalid date'}
                  </p>
                </div>
              </div>

              {selectedBooking.specialRequirements && (
                <div>
                  <Label className="text-muted-foreground">Special Requirements</Label>
                  <p className="text-sm">{selectedBooking.specialRequirements}</p>
                </div>
              )}

              {selectedBooking.handover && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Handover Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {selectedBooking.handover.pickup.pickupMethod === 'collect_from_previous' && (
                      <div>
                        <p className="font-medium">Pickup from Previous Booking:</p>
                        <p className="text-muted-foreground">
                          {selectedBooking.handover.pickup.previousCustodian?.eventName || 'Previous event'}
                        </p>
                      </div>
                    )}
                    {selectedBooking.handover.return.returnMethod === 'handover_to_next' && (
                      <div>
                        <p className="font-medium">Handover to Next Booking:</p>
                        <p className="text-muted-foreground">
                          {selectedBooking.handover.return.nextCustodian?.eventName}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
