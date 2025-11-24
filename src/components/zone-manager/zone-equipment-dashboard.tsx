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
import { Package, Plus, Edit, Trash2, Check, X, Calendar, DollarSign, AlertCircle, MapPin, ArrowRight, Truck, User, Printer, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import type { EquipmentItem, EquipmentBooking, PricingRule, BookingStatus } from '@/types/equipment';

interface ZoneEquipmentDashboardProps {
  zoneId: string;
  zoneName: string;
}

export function ZoneEquipmentDashboard({ zoneId, zoneName }: ZoneEquipmentDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Get auth token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };
  
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
  const [editingBooking, setEditingBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    pickupDate: '',
    returnDate: '',
    specialRequirements: '',
    status: 'pending' as BookingStatus,
  });
  
  // Pricing rules state
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(true);
  
  // Handover coordination state
  const [selectedHandoverBooking, setSelectedHandoverBooking] = useState<EquipmentBooking | null>(null);
  const [handoverChain, setHandoverChain] = useState<{
    previous?: EquipmentBooking;
    current: EquipmentBooking;
    next?: EquipmentBooking;
  } | null>(null);

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
    if (activeTab === 'bookings' || activeTab === 'manage-bookings' || activeTab === 'handover') fetchBookings();
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
        headers: getAuthHeaders(),
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
      const response = await fetch(`/api/equipment/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
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
        headers: getAuthHeaders()
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
        headers: getAuthHeaders(),
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

  const handleSaveBooking = async () => {
    if (!selectedBooking) return;

    try {
      const response = await fetch(`/api/equipment-bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          pickupDate: bookingForm.pickupDate,
          returnDate: bookingForm.returnDate,
          specialRequirements: bookingForm.specialRequirements,
          status: bookingForm.status,
        }),
      });

      if (!response.ok) throw new Error('Failed to update booking');

      toast({
        title: 'Success',
        description: 'Booking updated successfully',
      });

      setBookingDialogOpen(false);
      setEditingBooking(false);
      fetchBookings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update booking',
        variant: 'destructive',
      });
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await fetch(`/api/equipment-bookings/${bookingId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) throw new Error('Failed to cancel booking');

      toast({
        title: 'Success',
        description: 'Booking cancelled successfully',
      });

      fetchBookings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel booking',
        variant: 'destructive',
      });
    }
  };

  const handleViewHandoverChain = async (booking: EquipmentBooking) => {
    setSelectedHandoverBooking(booking);
    
    try {
      // Fetch the handover chain for this booking
      const response = await fetch(`/api/equipment-bookings/${booking.id}/handover-chain`);
      if (!response.ok) throw new Error('Failed to fetch handover chain');
      
      const data = await response.json();
      setHandoverChain(data.chain);
    } catch (error) {
      // If endpoint doesn't exist yet, construct locally
      const equipmentBookings = bookings.filter(b => b.equipmentId === booking.equipmentId);
      const sortedBookings = equipmentBookings.sort((a, b) => 
        new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime()
      );
      
      const currentIndex = sortedBookings.findIndex(b => b.id === booking.id);
      setHandoverChain({
        previous: currentIndex > 0 ? sortedBookings[currentIndex - 1] : undefined,
        current: booking,
        next: currentIndex < sortedBookings.length - 1 ? sortedBookings[currentIndex + 1] : undefined,
      });
    }
  };

  const handlePrintHandover = () => {
    if (!handoverChain) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formatDate = (date: any) => {
      if (!date) return 'TBD';
      const d = new Date(date);
      return !isNaN(d.getTime()) ? format(d, 'PPP') : 'TBD';
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Equipment Handover Details - ${handoverChain.current.equipmentName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .pickup { background-color: #E3F2FD; border-left: 4px solid #2196F3; }
            .current { background-color: #E8F5E9; border-left: 4px solid #4CAF50; font-weight: bold; }
            .dropoff { background-color: #F3E5F5; border-left: 4px solid #9C27B0; }
            .storage { background-color: #F5F5F5; border-left: 4px solid #9E9E9E; }
            .label { font-weight: bold; color: #555; }
            .value { margin-left: 10px; }
            .contact { margin: 10px 0; padding: 10px; background: #fafafa; border-radius: 3px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Equipment Handover Details</h1>
          <p><strong>Equipment:</strong> ${handoverChain.current.equipmentName}</p>
          <p><strong>Zone:</strong> ${zoneName}</p>
          <p><strong>Generated:</strong> ${format(new Date(), 'PPP p')}</p>
          
          <h2>🔵 Pickup From</h2>
          <div class="section ${handoverChain.previous ? 'pickup' : 'storage'}">
            ${handoverChain.previous ? `
              <p><span class="label">Club:</span><span class="value">${handoverChain.previous.clubName}</span></p>
              <div class="contact">
                <p><span class="label">Contact:</span><span class="value">${handoverChain.previous.custodian.name}</span></p>
                <p><span class="label">Email:</span><span class="value">${handoverChain.previous.custodian.email}</span></p>
                <p><span class="label">Phone:</span><span class="value">${handoverChain.previous.custodian.phone}</span></p>
              </div>
              <p><span class="label">Event:</span><span class="value">${handoverChain.previous.eventName || 'TBD'}</span></p>
              <p><span class="label">Location:</span><span class="value">${handoverChain.previous.useLocation?.address || 'TBD'}</span></p>
              <p><span class="label">Return Date:</span><span class="value">${formatDate(handoverChain.previous.returnDate)}</span></p>
            ` : `
              <p><strong>Zone Storage</strong></p>
              <p>Equipment will be collected from zone storage location</p>
            `}
          </div>

          <h2>🟢 Current Booking</h2>
          <div class="section current">
            <p><span class="label">Club:</span><span class="value">${handoverChain.current.clubName}</span></p>
            <div class="contact">
              <p><span class="label">Contact:</span><span class="value">${handoverChain.current.custodian.name}</span></p>
              <p><span class="label">Email:</span><span class="value">${handoverChain.current.custodian.email}</span></p>
              <p><span class="label">Phone:</span><span class="value">${handoverChain.current.custodian.phone}</span></p>
            </div>
            <p><span class="label">Event:</span><span class="value">${handoverChain.current.eventName || 'TBD'}</span></p>
            <p><span class="label">Location:</span><span class="value">${handoverChain.current.useLocation?.address || 'TBD'}</span></p>
            <p><span class="label">Pickup Date:</span><span class="value">${formatDate(handoverChain.current.pickupDate)}</span></p>
            <p><span class="label">Return Date:</span><span class="value">${formatDate(handoverChain.current.returnDate)}</span></p>
          </div>

          <h2>🟣 Drop-off To</h2>
          <div class="section ${handoverChain.next ? 'dropoff' : 'storage'}">
            ${handoverChain.next ? `
              <p><span class="label">Club:</span><span class="value">${handoverChain.next.clubName}</span></p>
              <div class="contact">
                <p><span class="label">Contact:</span><span class="value">${handoverChain.next.custodian.name}</span></p>
                <p><span class="label">Email:</span><span class="value">${handoverChain.next.custodian.email}</span></p>
                <p><span class="label">Phone:</span><span class="value">${handoverChain.next.custodian.phone}</span></p>
              </div>
              <p><span class="label">Event:</span><span class="value">${handoverChain.next.eventName || 'TBD'}</span></p>
              <p><span class="label">Location:</span><span class="value">${handoverChain.next.useLocation?.address || 'TBD'}</span></p>
              <p><span class="label">Pickup Date:</span><span class="value">${formatDate(handoverChain.next.pickupDate)}</span></p>
            ` : `
              <p><strong>Zone Storage</strong></p>
              <p>Equipment will be returned to zone storage location</p>
            `}
          </div>

          <button onclick="window.print()" style="margin-top: 30px; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Print</button>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleEmailHandover = () => {
    if (!handoverChain) return;

    const formatDate = (date: any) => {
      if (!date) return 'TBD';
      const d = new Date(date);
      return !isNaN(d.getTime()) ? format(d, 'PPP') : 'TBD';
    };

    // Collect all relevant email addresses
    const emails = [
      handoverChain.current.custodian.email,
      handoverChain.previous?.custodian.email,
      handoverChain.next?.custodian.email,
    ].filter(Boolean).join(',');

    const subject = encodeURIComponent(`Equipment Handover Details - ${handoverChain.current.equipmentName}`);
    
    const body = encodeURIComponent(
      `Equipment Handover Details\n\n` +
      `Equipment: ${handoverChain.current.equipmentName}\n` +
      `Zone: ${zoneName}\n\n` +
      `PICKUP FROM:\n` +
      (handoverChain.previous ? 
        `Club: ${handoverChain.previous.clubName}\n` +
        `Contact: ${handoverChain.previous.custodian.name}\n` +
        `Email: ${handoverChain.previous.custodian.email}\n` +
        `Phone: ${handoverChain.previous.custodian.phone}\n` +
        `Event: ${handoverChain.previous.eventName || 'TBD'}\n` +
        `Location: ${handoverChain.previous.useLocation?.address || 'TBD'}\n` +
        `Return Date: ${formatDate(handoverChain.previous.returnDate)}\n\n`
        : 'Zone Storage\n\n'
      ) +
      `CURRENT BOOKING:\n` +
      `Club: ${handoverChain.current.clubName}\n` +
      `Contact: ${handoverChain.current.custodian.name}\n` +
      `Email: ${handoverChain.current.custodian.email}\n` +
      `Phone: ${handoverChain.current.custodian.phone}\n` +
      `Event: ${handoverChain.current.eventName || 'TBD'}\n` +
      `Location: ${handoverChain.current.useLocation?.address || 'TBD'}\n` +
      `Pickup: ${formatDate(handoverChain.current.pickupDate)}\n` +
      `Return: ${formatDate(handoverChain.current.returnDate)}\n\n` +
      `DROP-OFF TO:\n` +
      (handoverChain.next ? 
        `Club: ${handoverChain.next.clubName}\n` +
        `Contact: ${handoverChain.next.custodian.name}\n` +
        `Email: ${handoverChain.next.custodian.email}\n` +
        `Phone: ${handoverChain.next.custodian.phone}\n` +
        `Event: ${handoverChain.next.eventName || 'TBD'}\n` +
        `Location: ${handoverChain.next.useLocation?.address || 'TBD'}\n` +
        `Pickup Date: ${formatDate(handoverChain.next.pickupDate)}\n`
        : 'Zone Storage\n'
      )
    );

    window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="manage-bookings">Manage Bookings</TabsTrigger>
          <TabsTrigger value="handover">Pickup & Drop-off</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
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
                            setEditingBooking(true);
                            const pickupDate = booking.pickupDate ? new Date(booking.pickupDate) : null;
                            const returnDate = booking.returnDate ? new Date(booking.returnDate) : null;
                            setBookingForm({
                              pickupDate: pickupDate && !isNaN(pickupDate.getTime()) 
                                ? pickupDate.toISOString().split('T')[0] 
                                : '',
                              returnDate: returnDate && !isNaN(returnDate.getTime()) 
                                ? returnDate.toISOString().split('T')[0] 
                                : '',
                              specialRequirements: booking.specialRequirements || '',
                              status: booking.status,
                            });
                            setBookingDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setEditingBooking(false);
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

        {/* Manage Bookings Tab */}
        <TabsContent value="manage-bookings" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Update or cancel existing bookings
            </p>
          </div>

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
                      No bookings to manage
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings
                    .filter(b => b.status !== 'cancelled' && b.status !== 'returned')
                    .map((booking) => {
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setEditingBooking(true);
                                const pickupDate = booking.pickupDate ? new Date(booking.pickupDate) : null;
                                const returnDate = booking.returnDate ? new Date(booking.returnDate) : null;
                                setBookingForm({
                                  pickupDate: pickupDate && !isNaN(pickupDate.getTime()) 
                                    ? pickupDate.toISOString().split('T')[0] 
                                    : '',
                                  returnDate: returnDate && !isNaN(returnDate.getTime()) 
                                    ? returnDate.toISOString().split('T')[0] 
                                    : '',
                                  specialRequirements: booking.specialRequirements || '',
                                  status: booking.status,
                                });
                                setBookingDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-destructive"
                            >
                              <X className="h-4 w-4" />
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

        {/* Handover Coordination Tab */}
        <TabsContent value="handover" className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Coordinate equipment pickup and drop-off between bookings
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Booking Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Booking</CardTitle>
                <CardDescription>Choose a booking to view its handover chain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {loadingBookings ? (
                  <p className="text-sm text-muted-foreground">Loading bookings...</p>
                ) : bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active bookings</p>
                ) : (
                  bookings
                    .filter(b => b.status !== 'cancelled' && b.status !== 'returned')
                    .map((booking) => {
                      const pickupDate = booking.pickupDate ? new Date(booking.pickupDate) : null;
                      const returnDate = booking.returnDate ? new Date(booking.returnDate) : null;
                      const isValidPickup = pickupDate && !isNaN(pickupDate.getTime());
                      const isValidReturn = returnDate && !isNaN(returnDate.getTime());
                      
                      return (
                        <Card 
                          key={booking.id}
                          className={`cursor-pointer transition-colors hover:bg-accent ${
                            selectedHandoverBooking?.id === booking.id ? 'border-primary bg-accent' : ''
                          }`}
                          onClick={() => handleViewHandoverChain(booking)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <p className="font-medium">{booking.equipmentName}</p>
                                <p className="text-sm text-muted-foreground">{booking.clubName}</p>
                                <p className="text-sm text-muted-foreground">{booking.eventName || 'Event TBD'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {isValidPickup && isValidReturn ? (
                                    `${format(pickupDate, 'MMM d')} - ${format(returnDate, 'MMM d, yyyy')}`
                                  ) : (
                                    'Invalid date'
                                  )}
                                </p>
                              </div>
                              <Badge variant={getStatusBadgeVariant(booking.status)} className="text-xs">
                                {booking.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                )}
              </CardContent>
            </Card>

            {/* Railway Diagram */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Handover Chain</CardTitle>
                    <CardDescription>
                      {handoverChain ? 'Equipment journey visualization' : 'Select a booking to view'}
                    </CardDescription>
                  </div>
                  {handoverChain && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handlePrintHandover}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleEmailHandover}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!handoverChain ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Truck className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Select a booking to view pickup and drop-off coordination</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Railway Diagram */}
                    <div className="relative">
                      {/* Previous Booking (Pickup From) */}
                      {handoverChain.previous ? (
                        <div className="mb-8">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Pickup From</p>
                              <p className="font-medium">{handoverChain.previous.clubName}</p>
                            </div>
                          </div>
                          <Card className="ml-13 border-blue-200 bg-blue-50">
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-sm font-medium">{handoverChain.previous.custodian.name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">{handoverChain.previous.custodian.email}</p>
                                <p className="text-xs text-muted-foreground">{handoverChain.previous.custodian.phone}</p>
                                <div className="pt-2 border-t">
                                  <p className="text-xs font-semibold">Event: {handoverChain.previous.eventName || 'TBD'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Location: {handoverChain.previous.useLocation?.address || 'TBD'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Return Date: {handoverChain.previous.returnDate ? format(new Date(handoverChain.previous.returnDate), 'PPP') : 'TBD'}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          {/* Railway track connector */}
                          <div className="ml-5 h-8 border-l-4 border-dashed border-blue-300"></div>
                          <div className="ml-3 mb-2">
                            <ArrowRight className="h-6 w-6 text-blue-400 rotate-90" />
                          </div>
                        </div>
                      ) : (
                        <div className="mb-8">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pickup From</p>
                              <p className="text-sm text-muted-foreground">Zone Storage</p>
                            </div>
                          </div>
                          <Card className="ml-13 border-gray-200 bg-gray-50">
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">Equipment will be collected from zone storage location</p>
                            </CardContent>
                          </Card>
                          <div className="ml-5 h-8 border-l-4 border-dashed border-gray-300"></div>
                          <div className="ml-3 mb-2">
                            <ArrowRight className="h-6 w-6 text-gray-400 rotate-90" />
                          </div>
                        </div>
                      )}

                      {/* Current Booking */}
                      <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Current Booking</p>
                            <p className="font-medium">{handoverChain.current.clubName}</p>
                          </div>
                        </div>
                        <Card className="ml-13 border-green-200 bg-green-50 ring-2 ring-green-500">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">{handoverChain.current.custodian.name}</p>
                              </div>
                              <p className="text-xs text-muted-foreground">{handoverChain.current.custodian.email}</p>
                              <p className="text-xs text-muted-foreground">{handoverChain.current.custodian.phone}</p>
                              <div className="pt-2 border-t">
                                <p className="text-xs font-semibold">Event: {handoverChain.current.eventName || 'TBD'}</p>
                                <p className="text-xs text-muted-foreground">
                                  Location: {handoverChain.current.useLocation?.address || 'TBD'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Pickup: {handoverChain.current.pickupDate ? format(new Date(handoverChain.current.pickupDate), 'PPP') : 'TBD'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Return: {handoverChain.current.returnDate ? format(new Date(handoverChain.current.returnDate), 'PPP') : 'TBD'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <div className="ml-5 h-8 border-l-4 border-dashed border-green-300"></div>
                        <div className="ml-3 mb-2">
                          <ArrowRight className="h-6 w-6 text-green-400 rotate-90" />
                        </div>
                      </div>

                      {/* Next Booking (Drop-off To) */}
                      {handoverChain.next ? (
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Drop-off To</p>
                              <p className="font-medium">{handoverChain.next.clubName}</p>
                            </div>
                          </div>
                          <Card className="ml-13 border-purple-200 bg-purple-50">
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-sm font-medium">{handoverChain.next.custodian.name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">{handoverChain.next.custodian.email}</p>
                                <p className="text-xs text-muted-foreground">{handoverChain.next.custodian.phone}</p>
                                <div className="pt-2 border-t">
                                  <p className="text-xs font-semibold">Event: {handoverChain.next.eventName || 'TBD'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Location: {handoverChain.next.useLocation?.address || 'TBD'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Pickup Date: {handoverChain.next.pickupDate ? format(new Date(handoverChain.next.pickupDate), 'PPP') : 'TBD'}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Drop-off To</p>
                              <p className="text-sm text-muted-foreground">Zone Storage</p>
                            </div>
                          </div>
                          <Card className="ml-13 border-gray-200 bg-gray-50">
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">Equipment will be returned to zone storage location</p>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
            </DialogTitle>
            <DialogDescription>
              {editingEquipment ? 'Update equipment details and pricing information' : 'Add new equipment to your zone inventory with pricing and availability details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Equipment Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={equipmentForm.name}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                    placeholder="e.g., Show Jumping Set, Sound System, Event Tent"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="category"
                    value={equipmentForm.category}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, category: e.target.value })}
                    placeholder="e.g., Arena Equipment, Safety Gear"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon" className="text-sm font-medium">Icon (Emoji)</Label>
                  <Input
                    id="icon"
                    value={equipmentForm.icon}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, icon: e.target.value })}
                    placeholder="e.g., 🏇 🎪 🚚 🎤 ⛺"
                    maxLength={4}
                    className="text-2xl text-center"
                  />
                  <p className="text-xs text-muted-foreground">Visual identifier for calendar display</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={equipmentForm.description}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
                    placeholder="Detailed description of the equipment, including any special features or requirements..."
                    rows={3}
                    className="text-base"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Pricing & Fees</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hirePrice" className="text-sm font-medium">Hire Price ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="hirePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={equipmentForm.hirePrice}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, hirePrice: parseFloat(e.target.value) || 0 })}
                      className="pl-7 text-base"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricingType" className="text-sm font-medium">Pricing Type</Label>
                  <Select
                    value={equipmentForm.pricingType}
                    onValueChange={(value: 'per_day' | 'flat_fee') => setEquipmentForm({ ...equipmentForm, pricingType: value })}
                  >
                    <SelectTrigger id="pricingType" className="text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_day">Per Day Rate</SelectItem>
                      <SelectItem value="flat_fee">Flat Fee (Per Event)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {equipmentForm.pricingType === 'flat_fee' 
                      ? '💡 Fixed price regardless of rental duration' 
                      : '💡 Price multiplied by number of days'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deposit" className="text-sm font-medium">Deposit Required ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="deposit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={equipmentForm.depositRequired}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, depositRequired: parseFloat(e.target.value) || 0 })}
                      className="pl-7 text-base"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bond" className="text-sm font-medium">Bond Amount ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="bond"
                      type="number"
                      min="0"
                      step="0.01"
                      value={equipmentForm.bondAmount}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, bondAmount: parseFloat(e.target.value) || 0 })}
                      className="pl-7 text-base"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory & Status Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Inventory & Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">Available Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={equipmentForm.quantity}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, quantity: parseInt(e.target.value) || 1 })}
                    className="text-base"
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">Number of units available for booking</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">Availability Status</Label>
                  <Select
                    value={equipmentForm.status}
                    onValueChange={(value: any) => setEquipmentForm({ ...equipmentForm, status: value })}
                  >
                    <SelectTrigger id="status" className="text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Available
                        </div>
                      </SelectItem>
                      <SelectItem value="in_use">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          In Use
                        </div>
                      </SelectItem>
                      <SelectItem value="maintenance">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          Maintenance
                        </div>
                      </SelectItem>
                      <SelectItem value="retired">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                          Retired
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEquipmentDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSaveEquipment} className="w-full sm:w-auto">
              <Package className="h-4 w-4 mr-2" />
              {editingEquipment ? 'Update Equipment' : 'Create Equipment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBooking ? 'Edit Booking' : 'Booking Details'}</DialogTitle>
            <DialogDescription>
              {editingBooking ? 'Update booking information below' : 'View booking details and information'}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              {!editingBooking ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Equipment</Label>
                      <p className="font-medium">{selectedBooking.equipmentName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Club</Label>
                      <p>{selectedBooking.clubName}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-pickup-date">Pickup Date</Label>
                    <Input
                      id="edit-pickup-date"
                      type="date"
                      value={bookingForm.pickupDate}
                      onChange={(e) => setBookingForm({ ...bookingForm, pickupDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-return-date">Return Date</Label>
                    <Input
                      id="edit-return-date"
                      type="date"
                      value={bookingForm.returnDate}
                      onChange={(e) => setBookingForm({ ...bookingForm, returnDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-special-requirements">Special Requirements</Label>
                    <Textarea
                      id="edit-special-requirements"
                      value={bookingForm.specialRequirements}
                      onChange={(e) => setBookingForm({ ...bookingForm, specialRequirements: e.target.value })}
                      placeholder="Any special requirements or notes..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={bookingForm.status}
                      onValueChange={(value: BookingStatus) => setBookingForm({ ...bookingForm, status: value })}
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="picked_up">Picked Up</SelectItem>
                        <SelectItem value="in_use">In Use</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setBookingDialogOpen(false);
              setEditingBooking(false);
            }}>
              {editingBooking ? 'Cancel' : 'Close'}
            </Button>
            {editingBooking && (
              <Button onClick={handleSaveBooking}>
                Save Changes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
