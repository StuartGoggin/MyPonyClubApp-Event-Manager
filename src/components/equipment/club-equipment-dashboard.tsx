'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, X, ArrowRight, Truck, User, MapPin, Package, Printer, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { EquipmentBooking, BookingStatus } from '@/types/equipment';
import { EquipmentCatalog } from './equipment-catalog';

interface ClubEquipmentDashboardProps {
  zoneId: string;
  zoneName: string;
  clubId: string;
  clubName: string;
  clubLocation: string;
  userEmail: string;
  userName: string;
  userPhone: string;
}

export function ClubEquipmentDashboard({
  zoneId,
  zoneName,
  clubId,
  clubName,
  clubLocation,
  userEmail,
  userName,
  userPhone,
}: ClubEquipmentDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('browse');
  
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
  });
  
  // Handover coordination state
  const [selectedHandoverBooking, setSelectedHandoverBooking] = useState<EquipmentBooking | null>(null);
  const [handoverChain, setHandoverChain] = useState<{
    previous?: EquipmentBooking;
    current: EquipmentBooking;
    next?: EquipmentBooking;
  } | null>(null);

  // Fetch bookings when switching to booking tabs
  useEffect(() => {
    if (activeTab === 'my-bookings' || activeTab === 'handover') {
      fetchBookings();
    }
  }, [activeTab, clubId]);

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const response = await fetch(`/api/equipment-bookings?clubId=${clubId}`);
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

  const handleSaveBooking = async () => {
    if (!selectedBooking) return;

    try {
      const response = await fetch(`/api/equipment-bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupDate: bookingForm.pickupDate,
          returnDate: bookingForm.returnDate,
          specialRequirements: bookingForm.specialRequirements,
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
        headers: { 'Content-Type': 'application/json' },
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
          <p><strong>Club:</strong> ${clubName}</p>
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

          <h2>🟢 Your Booking</h2>
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
      `Club: ${clubName}\n\n` +
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
      `YOUR BOOKING:\n` +
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
      case 'returned': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Equipment</h2>
        <p className="text-muted-foreground">
          Browse available equipment, manage your bookings, and coordinate handovers
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse & Book</TabsTrigger>
          <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="handover">Pickup & Drop-off</TabsTrigger>
        </TabsList>

        {/* Browse & Book Tab */}
        <TabsContent value="browse">
          <EquipmentCatalog
            zoneId={zoneId}
            zoneName={zoneName}
            clubId={clubId}
            clubName={clubName}
            clubLocation={clubLocation}
            userEmail={userEmail}
            userName={userName}
            userPhone={userPhone}
          />
        </TabsContent>

        {/* My Bookings Tab */}
        <TabsContent value="my-bookings" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
            </p>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingBookings ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No bookings yet. Browse equipment to create your first booking!
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
                          {booking.status !== 'cancelled' && booking.status !== 'returned' && (
                            <>
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
                            </>
                          )}
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

        {/* Handover Coordination Tab */}
        <TabsContent value="handover" className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Coordinate equipment pickup and drop-off with other clubs
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Booking Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Booking</CardTitle>
                <CardDescription>Choose a booking to view its handover details</CardDescription>
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
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Your Booking</p>
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
      </Tabs>

      {/* Booking Edit/View Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBooking ? 'Edit Booking' : 'Booking Details'}</DialogTitle>
            <DialogDescription>
              {editingBooking ? 'Update your booking details below' : 'View your booking information'}
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

                  <div>
                    <Label className="text-muted-foreground">Custodian</Label>
                    <p className="font-medium">{selectedBooking.custodian.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.custodian.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.custodian.phone}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Event</Label>
                    <p className="font-medium">{selectedBooking.eventName || 'Not specified'}</p>
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
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-muted-foreground">Equipment</Label>
                    <p className="font-medium">{selectedBooking.equipmentName}</p>
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
