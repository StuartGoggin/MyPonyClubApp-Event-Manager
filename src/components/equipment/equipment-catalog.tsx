'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Search, Package, Info, Calendar as CalendarCheckIcon, MapPin, DollarSign, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { EquipmentItem, EquipmentBooking } from '@/types/equipment';
import { cn } from '@/lib/utils';

interface EquipmentCatalogProps {
  zoneId: string;
  zoneName: string;
  clubId: string;
  clubName: string;
  userEmail: string;
  userName: string;
  userPhone: string;
}

export function EquipmentCatalog({
  zoneId,
  zoneName,
  clubId,
  clubName,
  userEmail,
  userName,
  userPhone,
}: EquipmentCatalogProps) {
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  
  // Booking form state
  const [pickupDate, setPickupDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [eventName, setEventName] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [useLocation, setUseLocation] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch equipment
  useEffect(() => {
    fetchEquipment();
  }, [zoneId]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        zoneId,
        available: 'true',
      });
      
      const response = await fetch(`/api/equipment?${params}`);
      if (!response.ok) throw new Error('Failed to fetch equipment');
      
      const data = await response.json();
      setEquipment(data.data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast({
        title: 'Error',
        description: 'Failed to load equipment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter equipment
  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(equipment.map(item => item.category)));

  // Handle booking submission
  const handleBookingSubmit = async () => {
    if (!selectedEquipment || !pickupDate || !returnDate || !eventName) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (returnDate < pickupDate) {
      toast({
        title: 'Invalid Dates',
        description: 'Return date must be after pickup date.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const bookingData = {
        equipmentId: selectedEquipment.id,
        equipmentName: selectedEquipment.name,
        zoneId,
        zoneName,
        clubId,
        clubName,
        custodian: {
          name: userName,
          email: userEmail,
          phone: userPhone,
        },
        pickupDate: pickupDate.toISOString(),
        returnDate: returnDate.toISOString(),
        eventName,
        eventLocation,
        useLocation: useLocation || eventLocation,
        specialRequirements,
        requestedBy: userName,
      };

      const response = await fetch('/api/equipment-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create booking');
      }

      const result = await response.json();

      toast({
        title: 'Booking Request Submitted!',
        description: `Your booking for ${selectedEquipment.name} has been submitted. You'll receive a confirmation email shortly.`,
      });

      // Reset form and close dialog
      setBookingDialogOpen(false);
      resetBookingForm();
      
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Booking Failed',
        description: error instanceof Error ? error.message : 'Failed to create booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBookingForm = () => {
    setPickupDate(undefined);
    setReturnDate(undefined);
    setEventName('');
    setEventLocation('');
    setUseLocation('');
    setSpecialRequirements('');
    setSelectedEquipment(null);
  };

  const openBookingDialog = (item: EquipmentItem) => {
    setSelectedEquipment(item);
    setBookingDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Equipment Catalog</h2>
        <p className="text-muted-foreground">
          Browse and book equipment available from {zoneName}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search Equipment</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEquipment.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No equipment found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No equipment is currently available'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEquipment.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                    <CardDescription>{item.category}</CardDescription>
                  </div>
                  <Badge variant={item.status === 'available' ? 'default' : 'secondary'}>
                    {item.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  {item.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  {item.basePricePerDay && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>${item.basePricePerDay}/day</span>
                    </div>
                  )}
                  
                  {item.quantity && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>Quantity: {item.quantity}</span>
                    </div>
                  )}
                  
                  {item.depositRequired > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span>Deposit: ${item.depositRequired}</span>
                    </div>
                  )}
                </div>

                {item.specifications && Object.keys(item.specifications).length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium mb-2">Specifications:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {Object.entries(item.specifications).slice(0, 4).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => openBookingDialog(item)}
                  disabled={item.status !== 'available'}
                >
                  <CalendarCheckIcon className="h-4 w-4 mr-2" />
                  Book Equipment
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book {selectedEquipment?.name}</DialogTitle>
            <DialogDescription>
              Fill in the details for your equipment booking. You'll receive a confirmation email once processed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Event Details */}
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                placeholder="e.g., Annual Show Jumping Competition"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventLocation">Event Location</Label>
              <Input
                id="eventLocation"
                placeholder="Event venue address"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pickup Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !pickupDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {pickupDate ? format(pickupDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={pickupDate}
                      onSelect={setPickupDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Return Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !returnDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {returnDate ? format(returnDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={returnDate}
                      onSelect={setReturnDate}
                      disabled={(date) => !pickupDate || date <= pickupDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Use Location */}
            <div className="space-y-2">
              <Label htmlFor="useLocation">Where will the equipment be used?</Label>
              <Input
                id="useLocation"
                placeholder="Leave blank if same as event location"
                value={useLocation}
                onChange={(e) => setUseLocation(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If different from event location (e.g., training ground, storage yard)
              </p>
            </div>

            {/* Special Requirements */}
            <div className="space-y-2">
              <Label htmlFor="specialRequirements">Special Requirements or Notes</Label>
              <Input
                id="specialRequirements"
                placeholder="Any special setup, delivery needs, or other notes"
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
              />
            </div>

            {/* Pricing Preview */}
            {selectedEquipment && pickupDate && returnDate && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">
                        {Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                    {selectedEquipment.basePricePerDay && (
                      <div className="flex justify-between">
                        <span>Base Rate:</span>
                        <span className="font-medium">${selectedEquipment.basePricePerDay}/day</span>
                      </div>
                    )}
                    {selectedEquipment.depositRequired > 0 && (
                      <div className="flex justify-between">
                        <span>Deposit Required:</span>
                        <span className="font-medium">${selectedEquipment.depositRequired}</span>
                      </div>
                    )}
                    {selectedEquipment.bondAmount && selectedEquipment.bondAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Bond (Refundable):</span>
                        <span className="font-medium">${selectedEquipment.bondAmount}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Info Display */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <p className="text-sm font-medium mb-2">Booking Contact:</p>
                <div className="text-sm space-y-1">
                  <p>{userName}</p>
                  <p className="text-muted-foreground">{userEmail}</p>
                  {userPhone && <p className="text-muted-foreground">{userPhone}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBookingSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
