'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Plus, Edit, Trash2, Check, X, Calendar, DollarSign, AlertCircle, MapPin, ArrowRight, Truck, User, Printer, Mail, MoreHorizontal, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import type { EquipmentItem, EquipmentBooking, PricingRule, BookingStatus } from '@/types/equipment';

interface ZoneEquipmentDashboardProps {
  zoneId: string;
  zoneName: string;
  onActionCountsChange?: (counts: { pending: number; handover: number }) => void;
}

export function ZoneEquipmentDashboard({ zoneId, zoneName, onActionCountsChange }: ZoneEquipmentDashboardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Handle token expiry
  const handleTokenExpiry = useCallback((error?: any) => {
    toast({
      title: 'Session Expired',
      description: 'Your session has expired. Please log in again.',
      variant: 'destructive',
    });
    
    // Clear auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    // Redirect to login after short delay
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  }, [toast, router]);
  
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
  const [homeLocationDialogOpen, setHomeLocationDialogOpen] = useState(false);
  const [editingHomeLocationFor, setEditingHomeLocationFor] = useState<EquipmentItem | null>(null);
  const [homeLocationForm, setHomeLocationForm] = useState({
    address: '',
    photo: '',
    accessInstructions: '',
    availabilityNotes: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactRole: '',
  });
  
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
  
  // Auto-approval state
  const [autoApprovalEnabled, setAutoApprovalEnabled] = useState(false);
  const [autoApprovedBookings, setAutoApprovedBookings] = useState<EquipmentBooking[]>([]);
  const [loadingAutoApproval, setLoadingAutoApproval] = useState(false);
  
  // Auto-email state
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(false);
  const [loadingAutoEmail, setLoadingAutoEmail] = useState(false);
  
  // Tab count indicators - recalculated whenever bookings change
  const pendingApprovalsCount = bookings.filter(b => b.status === 'pending').length;
  const handoverActionsCount = bookings.filter(b => 
    b.status === 'approved' || 
    b.status === 'confirmed' || 
    b.status === 'picked_up' || 
    b.status === 'in_use'
  ).length;
  
  // Notify parent of count changes
  useEffect(() => {
    // Only notify parent after bookings have been loaded (not during initial empty state)
    if (onActionCountsChange && !loadingBookings) {
      onActionCountsChange({
        pending: pendingApprovalsCount,
        handover: handoverActionsCount
      });
    }
  }, [pendingApprovalsCount, handoverActionsCount, onActionCountsChange, loadingBookings]);
  
  // Handover coordination state
  const [selectedHandoverBooking, setSelectedHandoverBooking] = useState<EquipmentBooking | null>(null);
  const [handoverChain, setHandoverChain] = useState<{
    previous?: EquipmentBooking;
    current: EquipmentBooking;
    next?: EquipmentBooking;
  } | null>(null);
  const [equipmentHomeLocation, setEquipmentHomeLocation] = useState<any>(null);

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

  // Fetch functions
  const fetchEquipment = useCallback(async () => {
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
  }, [zoneId, toast]);

  const fetchBookings = useCallback(async () => {
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
  }, [zoneId, toast]);

  const fetchPricingRules = useCallback(async () => {
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
  }, [zoneId, toast]);

  // Fetch auto-approval settings and history
  const fetchAutoApprovalSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/equipment-automations?zoneId=${zoneId}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch automation settings');
      const data = await response.json();
      setAutoApprovalEnabled(data.autoApproval?.enabled || false);
      setAutoEmailEnabled(data.autoEmail?.enabled || false);
      setAutoApprovedBookings(data.autoApprovedBookings || []);
    } catch (error) {
      console.error('Error fetching automation settings:', error);
    }
  }, [zoneId]);

  // Toggle auto-approval
  const toggleAutoApproval = async () => {
    try {
      setLoadingAutoApproval(true);
      const newState = !autoApprovalEnabled;
      
      const response = await fetch(`/api/equipment-automations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          zoneId,
          type: 'autoApproval',
          enabled: newState
        })
      });

      if (!response.ok) throw new Error('Failed to update auto-approval settings');

      setAutoApprovalEnabled(newState);
      
      toast({
        title: 'Success',
        description: `Auto-approval ${newState ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update auto-approval settings',
        variant: 'destructive',
      });
    } finally {
      setLoadingAutoApproval(false);
    }
  };

  // Toggle auto-email
  const toggleAutoEmail = async () => {
    try {
      setLoadingAutoEmail(true);
      const newState = !autoEmailEnabled;
      
      const response = await fetch(`/api/equipment-automations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          zoneId,
          type: 'autoEmail',
          enabled: newState
        })
      });

      if (!response.ok) throw new Error('Failed to update auto-email settings');

      setAutoEmailEnabled(newState);
      
      toast({
        title: 'Success',
        description: `Auto-email ${newState ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update auto-email settings',
        variant: 'destructive',
      });
    } finally {
      setLoadingAutoEmail(false);
    }
  };

  // Fetch data
  useEffect(() => {
    if (activeTab === 'inventory') fetchEquipment();
    if (activeTab === 'bookings' || activeTab === 'manage-bookings' || activeTab === 'handover') fetchBookings();
    if (activeTab === 'pricing') fetchPricingRules();
    if (activeTab === 'automations') fetchAutoApprovalSettings();
  }, [activeTab, fetchEquipment, fetchBookings, fetchPricingRules, fetchAutoApprovalSettings]);

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

  const handleEditHomeLocation = (item: EquipmentItem) => {
    setEditingHomeLocationFor(item);
    if (item.homeLocation) {
      setHomeLocationForm({
        address: item.homeLocation.address || '',
        photo: item.homeLocation.photo || '',
        accessInstructions: item.homeLocation.accessInstructions || '',
        availabilityNotes: item.homeLocation.availabilityNotes || '',
        contactName: item.homeLocation.contactPerson?.name || '',
        contactPhone: item.homeLocation.contactPerson?.phone || '',
        contactEmail: item.homeLocation.contactPerson?.email || '',
        contactRole: item.homeLocation.contactPerson?.role || '',
      });
    } else {
      setHomeLocationForm({
        address: '',
        photo: '',
        accessInstructions: '',
        availabilityNotes: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        contactRole: '',
      });
    }
    setHomeLocationDialogOpen(true);
  };

  const handleSaveHomeLocation = async () => {
    if (!editingHomeLocationFor) return;

    try {
      const homeLocation = {
        address: homeLocationForm.address,
        photo: homeLocationForm.photo || undefined,
        accessInstructions: homeLocationForm.accessInstructions || undefined,
        availabilityNotes: homeLocationForm.availabilityNotes || undefined,
        contactPerson: {
          name: homeLocationForm.contactName,
          phone: homeLocationForm.contactPhone,
          email: homeLocationForm.contactEmail,
          role: homeLocationForm.contactRole || undefined,
        },
      };

      const response = await fetch(`/api/equipment/${editingHomeLocationFor.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ homeLocation }),
      });

      if (response.status === 401) {
        toast({
          title: 'Authentication Error',
          description: 'Your session has expired. Please refresh the page and sign in again.',
          variant: 'destructive',
        });
        return;
      }

      if (!response.ok) throw new Error('Failed to update home location');

      toast({
        title: 'Success',
        description: 'Zone home location updated successfully',
      });

      setHomeLocationDialogOpen(false);
      fetchEquipment();
    } catch (error) {
      console.error('Error updating home location:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update home location',
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

      if (response.status === 401) {
        const data = await response.json();
        if (data.code === 'TOKEN_EXPIRED' || data.error?.includes('expired')) {
          handleTokenExpiry();
          return;
        }
      }

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

      if (response.status === 401) {
        const data = await response.json();
        if (data.code === 'TOKEN_EXPIRED' || data.error?.includes('expired')) {
          handleTokenExpiry();
          return;
        }
      }

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

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/equipment-bookings/${bookingId}?permanent=true`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to delete booking');

      toast({
        title: 'Success',
        description: 'Booking deleted successfully',
      });

      fetchBookings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete booking',
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
      
      // Fetch equipment details to get homeLocation
      try {
        const equipmentResponse = await fetch(`/api/equipment/${booking.equipmentId}`);
        if (equipmentResponse.ok) {
          const equipmentData = await equipmentResponse.json();
          setEquipmentHomeLocation(equipmentData.data?.homeLocation);
        }
      } catch (error) {
        console.error('Failed to fetch equipment home location:', error);
      }
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
      
      // Try to fetch equipment details for homeLocation
      try {
        const equipmentResponse = await fetch(`/api/equipment/${booking.equipmentId}`);
        if (equipmentResponse.ok) {
          const equipmentData = await equipmentResponse.json();
          setEquipmentHomeLocation(equipmentData.data?.homeLocation);
        }
      } catch (error) {
        console.error('Failed to fetch equipment home location:', error);
      }
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
            @page { 
              size: A4 portrait; 
              margin: 10mm; 
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
              margin: 12px; 
              color: #1e293b;
              line-height: 1.3;
              font-size: 9px;
              background: #ffffff;
            }
            .header { 
              margin-bottom: 10px; 
              padding: 10px 12px;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              border-radius: 8px;
              color: white;
            }
            h1 { 
              font-size: 16px; 
              font-weight: 700; 
              color: white; 
              margin-bottom: 4px;
              letter-spacing: -0.3px;
            }
            .meta { 
              display: flex; 
              gap: 16px; 
              font-size: 9px; 
              color: #cbd5e1; 
              margin-top: 4px;
              flex-wrap: wrap;
            }
            .meta-item { 
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 3px;
            }
            .meta-item strong { 
              color: white;
              font-weight: 600;
            }
            
            .handover-flow { margin: 8px 0; }
            .flow-section { 
              margin: 8px 0; 
              page-break-inside: avoid;
            }
            .section-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 6px;
              padding-bottom: 4px;
              border-bottom: 1px solid #f1f5f9;
            }
            .section-icon {
              width: 28px;
              height: 28px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: 700;
              color: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              flex-shrink: 0;
            }
            .pickup-icon { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
            .current-icon { background: linear-gradient(135deg, #10b981 0%, #047857 100%); }
            .dropoff-icon { background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%); }
            .storage-icon { background: linear-gradient(135deg, #64748b 0%, #334155 100%); }
            
            .section-title {
              font-size: 12px;
              font-weight: 700;
              color: #0f172a;
              flex: 1;
            }
            
            .card {
              background: white;
              border-radius: 6px;
              padding: 8px 10px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.06);
              border: 1px solid #f1f5f9;
            }
            .card.current {
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              border: 2px solid #10b981;
              box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
            }
            .card.pickup { 
              border-left: 3px solid #3b82f6;
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            }
            .card.dropoff { 
              border-left: 3px solid #a855f7;
              background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
            }
            .card.storage { 
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border-left: 3px solid #64748b; 
            }
            
            .info-group { 
              margin: 6px 0;
              padding: 5px 0;
            }
            .info-group:first-child { 
              margin-top: 0;
              padding-top: 0;
            }
            .info-group:last-child { 
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .info-group + .info-group {
              border-top: 1px solid #e2e8f0;
            }
            
            .info-row {
              display: flex;
              padding: 2px 0;
              font-size: 9px;
              line-height: 1.4;
            }
            .label { 
              font-weight: 600; 
              color: #475569;
              min-width: 75px;
            }
            .value { 
              color: #0f172a;
              flex: 1;
              font-weight: 500;
            }
            
            .contact-box {
              background: white;
              border-radius: 5px;
              padding: 6px 8px;
              margin: 5px 0;
              border: 1px solid #e2e8f0;
            }
            .current .contact-box {
              background: white;
              border-color: #86efac;
            }
            .contact-title {
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 3px;
              font-size: 10px;
              padding-bottom: 2px;
              border-bottom: 1px solid #f1f5f9;
            }
            
            .storage-notice {
              padding: 8px;
              background: white;
              border-radius: 5px;
              border: 2px dashed #cbd5e1;
            }
            .storage-title { 
              font-weight: 700; 
              font-size: 10px;
              color: #334155;
              margin-bottom: 3px;
            }
            .storage-text { 
              color: #64748b;
              font-size: 9px;
              line-height: 1.3;
            }
            
            .storage-details img {
              max-width: 180px;
              border-radius: 4px;
              border: 1px solid #cbd5e1;
              margin-bottom: 6px;
            }
            
            .connector {
              margin: 4px 0;
              text-align: center;
              height: 16px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .connector-line {
              width: 2px;
              height: 5px;
              background: linear-gradient(to bottom, #cbd5e1 0%, #94a3b8 100%);
              border-radius: 1px;
            }
            .connector-dot {
              width: 6px;
              height: 6px;
              background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
              border-radius: 50%;
              margin: 2px 0;
              border: 1px solid white;
            }
            
            button {
              margin-top: 12px;
              padding: 8px 16px;
              background: linear-gradient(135deg, #10b981 0%, #047857 100%);
              color: white;
              border: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 11px;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
            }
            
            @media print { 
              body { margin: 0; background: white; }
              button { display: none; }
              .header { 
                background: #0f172a !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .card { 
                box-shadow: none;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .card.current { 
                border: 2px solid #10b981 !important;
                background: #dcfce7 !important;
              }
              .card.pickup {
                background: #dbeafe !important;
              }
              .card.dropoff {
                background: #f3e8ff !important;
              }
              .card.storage {
                background: #f1f5f9 !important;
              }
              .section-icon { 
                box-shadow: none;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Equipment Handover Details</h1>
            <div class="meta">
              <span class="meta-item"><strong>Equipment:</strong> ${handoverChain.current.equipmentName}</span>
              <span class="meta-item"><strong>Zone:</strong> ${zoneName}</span>
              <span class="meta-item"><strong>Generated:</strong> ${format(new Date(), 'PPP p')}</span>
            </div>
          </div>
          
          <div class="handover-flow">
            <!-- Pickup Section -->
            <div class="flow-section">
              <div class="section-header">
                <div class="section-icon ${handoverChain.previous ? 'pickup-icon' : 'storage-icon'}">
                  ${handoverChain.previous ? '📦' : '🏢'}
                </div>
                <div class="section-title">Pickup From</div>
              </div>
              ${handoverChain.previous ? `
                <div class="card pickup">
                  <div class="info-group">
                    <div class="info-row">
                      <span class="label">Club:</span>
                      <span class="value">${handoverChain.previous.clubName}</span>
                    </div>
                  </div>
                  
                  <div class="contact-box">
                    <div class="contact-title">Contact Person</div>
                    <div class="info-row">
                      <span class="label">Name:</span>
                      <span class="value">${handoverChain.previous.custodian.name}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Email:</span>
                      <span class="value">${handoverChain.previous.custodian.email}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Phone:</span>
                      <span class="value">${handoverChain.previous.custodian.phone}</span>
                    </div>
                  </div>
                  
                  <div class="info-group">
                    <div class="info-row">
                      <span class="label">Event:</span>
                      <span class="value">${handoverChain.previous.eventName || 'TBD'}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Location:</span>
                      <span class="value">${handoverChain.previous.useLocation?.address || 'TBD'}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Return Date:</span>
                      <span class="value">${formatDate(handoverChain.previous.returnDate)}</span>
                    </div>
                  </div>
                </div>
              ` : `
                <div class="card storage">
                  ${equipmentHomeLocation ? `
                    <div class="info-group">
                      <div class="storage-title" style="margin-bottom: 8px;">Zone Storage</div>
                      <div class="storage-text" style="margin-bottom: 12px;">Equipment will be collected from the zone storage location</div>
                    </div>
                    ${equipmentHomeLocation.photo ? `
                      <div style="text-align: center; margin: 12px 0;">
                        <img src="${equipmentHomeLocation.photo}" alt="Storage Location" style="max-width: 280px; border-radius: 6px; border: 2px solid #cbd5e1;" />
                      </div>
                    ` : ''}
                    <div class="info-group">
                      <div class="info-row">
                        <span class="label">Address:</span>
                        <span class="value">${equipmentHomeLocation.address}</span>
                      </div>
                      ${equipmentHomeLocation.accessInstructions ? `
                        <div class="info-row">
                          <span class="label">Access:</span>
                          <span class="value">${equipmentHomeLocation.accessInstructions}</span>
                        </div>
                      ` : ''}
                    </div>
                    <div class="contact-box">
                      <div class="contact-title">Contact for Access</div>
                      <div class="info-row">
                        <span class="label">Name:</span>
                        <span class="value">${equipmentHomeLocation.contactPerson.name}${equipmentHomeLocation.contactPerson.role ? ` (${equipmentHomeLocation.contactPerson.role})` : ''}</span>
                      </div>
                      <div class="info-row">
                        <span class="label">Phone:</span>
                        <span class="value">${equipmentHomeLocation.contactPerson.phone}</span>
                      </div>
                      <div class="info-row">
                        <span class="label">Email:</span>
                        <span class="value">${equipmentHomeLocation.contactPerson.email}</span>
                      </div>
                      ${equipmentHomeLocation.availabilityNotes ? `
                        <div class="info-row">
                          <span class="label">Availability:</span>
                          <span class="value">${equipmentHomeLocation.availabilityNotes}</span>
                        </div>
                      ` : ''}
                    </div>
                  ` : `
                    <div class="storage-notice">
                      <div class="storage-title">Zone Storage</div>
                      <div class="storage-text">Equipment will be collected from the zone storage location</div>
                    </div>
                  `}
                </div>
              `}
            </div>

            <div class="connector">
              <div class="connector-line"></div>
              <div class="connector-dot"></div>
              <div class="connector-line"></div>
            </div>

            <!-- Current Booking Section -->
            <div class="flow-section">
              <div class="section-header">
                <div class="section-icon current-icon">✓</div>
                <div class="section-title">Current Booking</div>
              </div>
              <div class="card current">
                <div class="info-group">
                  <div class="info-row">
                    <span class="label">Club:</span>
                    <span class="value">${handoverChain.current.clubName}</span>
                  </div>
                </div>
                
                <div class="contact-box">
                  <div class="contact-title">Contact Person</div>
                  <div class="info-row">
                    <span class="label">Name:</span>
                    <span class="value">${handoverChain.current.custodian.name}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">${handoverChain.current.custodian.email}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Phone:</span>
                    <span class="value">${handoverChain.current.custodian.phone}</span>
                  </div>
                </div>
                
                <div class="info-group">
                  <div class="info-row">
                    <span class="label">Event:</span>
                    <span class="value">${handoverChain.current.eventName || 'TBD'}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Location:</span>
                    <span class="value">${handoverChain.current.useLocation?.address || 'TBD'}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Pickup Date:</span>
                    <span class="value">${formatDate(handoverChain.current.pickupDate)}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Return Date:</span>
                    <span class="value">${formatDate(handoverChain.current.returnDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="connector">
              <div class="connector-line"></div>
              <div class="connector-dot"></div>
              <div class="connector-line"></div>
            </div>

            <!-- Drop-off Section -->
            <div class="flow-section">
              <div class="section-header">
                <div class="section-icon ${handoverChain.next ? 'dropoff-icon' : 'storage-icon'}">
                  ${handoverChain.next ? '🎯' : '🏢'}
                </div>
                <div class="section-title">Drop-off To</div>
              </div>
              ${handoverChain.next ? `
                <div class="card dropoff">
                  <div class="info-group">
                    <div class="info-row">
                      <span class="label">Club:</span>
                      <span class="value">${handoverChain.next.clubName}</span>
                    </div>
                  </div>
                  
                  <div class="contact-box">
                    <div class="contact-title">Contact Person</div>
                    <div class="info-row">
                      <span class="label">Name:</span>
                      <span class="value">${handoverChain.next.custodian.name}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Email:</span>
                      <span class="value">${handoverChain.next.custodian.email}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Phone:</span>
                      <span class="value">${handoverChain.next.custodian.phone}</span>
                    </div>
                  </div>
                  
                  <div class="info-group">
                    <div class="info-row">
                      <span class="label">Event:</span>
                      <span class="value">${handoverChain.next.eventName || 'TBD'}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Location:</span>
                      <span class="value">${handoverChain.next.useLocation?.address || 'TBD'}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">Pickup Date:</span>
                      <span class="value">${formatDate(handoverChain.next.pickupDate)}</span>
                    </div>
                  </div>
                </div>
              ` : `
                <div class="card storage">
                  ${equipmentHomeLocation ? `
                    <div class="info-group">
                      <div class="storage-title" style="margin-bottom: 8px;">Zone Storage</div>
                      <div class="storage-text" style="margin-bottom: 12px;">Equipment will be returned to the zone storage location</div>
                    </div>
                    ${equipmentHomeLocation.photo ? `
                      <div style="text-align: center; margin: 12px 0;">
                        <img src="${equipmentHomeLocation.photo}" alt="Storage Location" style="max-width: 280px; border-radius: 6px; border: 2px solid #cbd5e1;" />
                      </div>
                    ` : ''}
                    <div class="info-group">
                      <div class="info-row">
                        <span class="label">Address:</span>
                        <span class="value">${equipmentHomeLocation.address}</span>
                      </div>
                      ${equipmentHomeLocation.accessInstructions ? `
                        <div class="info-row">
                          <span class="label">Access:</span>
                          <span class="value">${equipmentHomeLocation.accessInstructions}</span>
                        </div>
                      ` : ''}
                    </div>
                    <div class="contact-box">
                      <div class="contact-title">Contact for Access</div>
                      <div class="info-row">
                        <span class="label">Name:</span>
                        <span class="value">${equipmentHomeLocation.contactPerson.name}${equipmentHomeLocation.contactPerson.role ? ` (${equipmentHomeLocation.contactPerson.role})` : ''}</span>
                      </div>
                      <div class="info-row">
                        <span class="label">Phone:</span>
                        <span class="value">${equipmentHomeLocation.contactPerson.phone}</span>
                      </div>
                      <div class="info-row">
                        <span class="label">Email:</span>
                        <span class="value">${equipmentHomeLocation.contactPerson.email}</span>
                      </div>
                      ${equipmentHomeLocation.availabilityNotes ? `
                        <div class="info-row">
                          <span class="label">Availability:</span>
                          <span class="value">${equipmentHomeLocation.availabilityNotes}</span>
                        </div>
                      ` : ''}
                    </div>
                  ` : `
                    <div class="storage-notice">
                      <div class="storage-title">Zone Storage</div>
                      <div class="storage-text">Equipment will be returned to the zone storage location</div>
                    </div>
                  `}
                </div>
              `}
            </div>
          </div>

          <button onclick="window.print()">Print Handover Details</button>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleEmailHandover = async () => {
    if (!handoverChain) return;

    try {
      const response = await fetch('/api/equipment-handover-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          handoverChain,
          contextName: zoneName,
          contextType: 'zone',
          equipmentHomeLocation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const result = await response.json();
      toast({
        title: 'Email Queued',
        description: 'Handover details have been queued for delivery to all participants.',
      });
    } catch (error) {
      console.error('Error sending handover email:', error);
      toast({
        title: 'Error',
        description: 'Failed to queue handover email. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEmailHandover_OLD = () => {
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
    
    // HTML email body with modern styling (inline CSS for email compatibility)
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 2px solid #e2e8f0;">
              <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 700; color: #0f172a;">
                Equipment Handover Details
              </h1>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #64748b;">
                    <strong style="color: #334155;">Equipment:</strong> ${handoverChain.current.equipmentName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #64748b;">
                    <strong style="color: #334155;">Zone:</strong> ${zoneName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #64748b;">
                    <strong style="color: #334155;">Generated:</strong> ${format(new Date(), 'PPP p')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pickup Section -->
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 48px; height: 48px; background: linear-gradient(135deg, ${handoverChain.previous ? '#3b82f6, #2563eb' : '#64748b, #475569'}); border-radius: 12px; text-align: center; font-size: 24px; vertical-align: middle;">
                          ${handoverChain.previous ? '📦' : '🏢'}
                        </td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #0f172a; vertical-align: middle;">
                          Pickup From
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px;">
                    ${handoverChain.previous ? `
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-left: 4px solid #3b82f6; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <tr>
                          <td style="padding: 20px;">
                            <table width="100%" cellpadding="4" cellspacing="0">
                              <tr>
                                <td style="font-weight: 600; color: #475569; width: 120px;">Club:</td>
                                <td style="color: #0f172a;">${handoverChain.previous.clubName}</td>
                              </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 12px 0; background: linear-gradient(to bottom right, #f8fafc, #f1f5f9); border-radius: 8px; border: 1px solid #e2e8f0;">
                              <tr>
                                <td style="padding: 16px;">
                                  <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px; font-size: 15px;">Contact Person</div>
                                  <table width="100%" cellpadding="4" cellspacing="0">
                                    <tr>
                                      <td style="font-weight: 600; color: #475569; width: 120px;">Name:</td>
                                      <td style="color: #0f172a;">${handoverChain.previous.custodian.name}</td>
                                    </tr>
                                    <tr>
                                      <td style="font-weight: 600; color: #475569;">Email:</td>
                                      <td style="color: #0f172a;">${handoverChain.previous.custodian.email}</td>
                                    </tr>
                                    <tr>
                                      <td style="font-weight: 600; color: #475569;">Phone:</td>
                                      <td style="color: #0f172a;">${handoverChain.previous.custodian.phone}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                            
                            <table width="100%" cellpadding="4" cellspacing="0">
                              <tr>
                                <td style="font-weight: 600; color: #475569; width: 120px;">Event:</td>
                                <td style="color: #0f172a;">${handoverChain.previous.eventName || 'TBD'}</td>
                              </tr>
                              <tr>
                                <td style="font-weight: 600; color: #475569;">Location:</td>
                                <td style="color: #0f172a;">${handoverChain.previous.useLocation?.address || 'TBD'}</td>
                              </tr>
                              <tr>
                                <td style="font-weight: 600; color: #475569;">Return Date:</td>
                                <td style="color: #0f172a;">${formatDate(handoverChain.previous.returnDate)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    ` : `
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom right, #f8fafc, #f1f5f9); border-left: 4px solid #64748b; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <tr>
                          <td style="padding: 20px; text-align: center;">
                            <div style="font-weight: 700; font-size: 16px; color: #334155; margin-bottom: 8px;">Zone Storage</div>
                            <div style="color: #64748b; font-size: 14px;">Equipment will be collected from the zone storage location</div>
                          </td>
                        </tr>
                      </table>
                    `}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Connector -->
          <tr>
            <td align="center" style="padding: 0;">
              <div style="width: 2px; height: 20px; background: linear-gradient(to bottom, #cbd5e1, #94a3b8);"></div>
              <div style="width: 12px; height: 12px; background: #94a3b8; border-radius: 50%; margin: 8px 0;"></div>
              <div style="width: 2px; height: 20px; background: linear-gradient(to bottom, #cbd5e1, #94a3b8);"></div>
            </td>
          </tr>

          <!-- Current Booking Section -->
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; text-align: center; font-size: 24px; vertical-align: middle;">
                          ✓
                        </td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #0f172a; vertical-align: middle;">
                          Current Booking
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom right, #f0fdf4, #dcfce7); border: 2px solid #10b981; border-radius: 8px; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);">
                      <tr>
                        <td style="padding: 20px;">
                          <table width="100%" cellpadding="4" cellspacing="0">
                            <tr>
                              <td style="font-weight: 600; color: #475569; width: 120px;">Club:</td>
                              <td style="color: #0f172a;">${handoverChain.current.clubName}</td>
                            </tr>
                          </table>
                          
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 12px 0; background: linear-gradient(to bottom right, #ecfdf5, #d1fae5); border-radius: 8px; border: 1px solid #86efac;">
                            <tr>
                              <td style="padding: 16px;">
                                <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px; font-size: 15px;">Contact Person</div>
                                <table width="100%" cellpadding="4" cellspacing="0">
                                  <tr>
                                    <td style="font-weight: 600; color: #475569; width: 120px;">Name:</td>
                                    <td style="color: #0f172a;">${handoverChain.current.custodian.name}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-weight: 600; color: #475569;">Email:</td>
                                    <td style="color: #0f172a;">${handoverChain.current.custodian.email}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-weight: 600; color: #475569;">Phone:</td>
                                    <td style="color: #0f172a;">${handoverChain.current.custodian.phone}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          
                          <table width="100%" cellpadding="4" cellspacing="0">
                            <tr>
                              <td style="font-weight: 600; color: #475569; width: 120px;">Event:</td>
                              <td style="color: #0f172a;">${handoverChain.current.eventName || 'TBD'}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: 600; color: #475569;">Location:</td>
                              <td style="color: #0f172a;">${handoverChain.current.useLocation?.address || 'TBD'}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: 600; color: #475569;">Pickup Date:</td>
                              <td style="color: #0f172a;">${formatDate(handoverChain.current.pickupDate)}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: 600; color: #475569;">Return Date:</td>
                              <td style="color: #0f172a;">${formatDate(handoverChain.current.returnDate)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Connector -->
          <tr>
            <td align="center" style="padding: 0;">
              <div style="width: 2px; height: 20px; background: linear-gradient(to bottom, #cbd5e1, #94a3b8);"></div>
              <div style="width: 12px; height: 12px; background: #94a3b8; border-radius: 50%; margin: 8px 0;"></div>
              <div style="width: 2px; height: 20px; background: linear-gradient(to bottom, #cbd5e1, #94a3b8);"></div>
            </td>
          </tr>

          <!-- Drop-off Section -->
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 48px; height: 48px; background: linear-gradient(135deg, ${handoverChain.next ? '#a855f7, #9333ea' : '#64748b, #475569'}); border-radius: 12px; text-align: center; font-size: 24px; vertical-align: middle;">
                          ${handoverChain.next ? '🎯' : '🏢'}
                        </td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #0f172a; vertical-align: middle;">
                          Drop-off To
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px;">
                    ${handoverChain.next ? `
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-left: 4px solid #a855f7; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <tr>
                          <td style="padding: 20px;">
                            <table width="100%" cellpadding="4" cellspacing="0">
                              <tr>
                                <td style="font-weight: 600; color: #475569; width: 120px;">Club:</td>
                                <td style="color: #0f172a;">${handoverChain.next.clubName}</td>
                              </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 12px 0; background: linear-gradient(to bottom right, #f8fafc, #f1f5f9); border-radius: 8px; border: 1px solid #e2e8f0;">
                              <tr>
                                <td style="padding: 16px;">
                                  <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px; font-size: 15px;">Contact Person</div>
                                  <table width="100%" cellpadding="4" cellspacing="0">
                                    <tr>
                                      <td style="font-weight: 600; color: #475569; width: 120px;">Name:</td>
                                      <td style="color: #0f172a;">${handoverChain.next.custodian.name}</td>
                                    </tr>
                                    <tr>
                                      <td style="font-weight: 600; color: #475569;">Email:</td>
                                      <td style="color: #0f172a;">${handoverChain.next.custodian.email}</td>
                                    </tr>
                                    <tr>
                                      <td style="font-weight: 600; color: #475569;">Phone:</td>
                                      <td style="color: #0f172a;">${handoverChain.next.custodian.phone}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                            
                            <table width="100%" cellpadding="4" cellspacing="0">
                              <tr>
                                <td style="font-weight: 600; color: #475569; width: 120px;">Event:</td>
                                <td style="color: #0f172a;">${handoverChain.next.eventName || 'TBD'}</td>
                              </tr>
                              <tr>
                                <td style="font-weight: 600; color: #475569;">Location:</td>
                                <td style="color: #0f172a;">${handoverChain.next.useLocation?.address || 'TBD'}</td>
                              </tr>
                              <tr>
                                <td style="font-weight: 600; color: #475569;">Pickup Date:</td>
                                <td style="color: #0f172a;">${formatDate(handoverChain.next.pickupDate)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    ` : `
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom right, #f8fafc, #f1f5f9); border-left: 4px solid #64748b; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <tr>
                          <td style="padding: 20px; text-align: center;">
                            <div style="font-weight: 700; font-size: 16px; color: #334155; margin-bottom: 8px;">Zone Storage</div>
                            <div style="color: #64748b; font-size: 14px;">Equipment will be returned to the zone storage location</div>
                          </td>
                        </tr>
                      </table>
                    `}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Create mailto link with HTML body
    const body = encodeURIComponent(htmlBody);
    window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
  }; // END OLD FUNCTION

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default'; // Green/Blue for approved
      case 'confirmed': return 'default'; // Green/Blue for confirmed
      case 'pending': return 'secondary'; // Yellow/Orange for pending
      case 'rejected': return 'destructive'; // Red for rejected
      case 'cancelled': return 'destructive'; // Red for cancelled
      case 'completed': return 'outline'; // Gray for completed
      case 'picked_up': return 'default'; // Green for picked up
      case 'in_use': return 'default'; // Green for in use
      case 'returned': return 'outline'; // Gray for returned
      case 'overdue': return 'destructive'; // Red for overdue
      default: return 'secondary';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300';
      case 'picked_up': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200';
      case 'in_use': return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-200';
      case 'returned': return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300';
      case 'overdue': return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="inventory" title="Manage equipment inventory">
            Inventory
          </TabsTrigger>
          <TabsTrigger value="bookings" title="View all equipment bookings">
            Bookings
          </TabsTrigger>
          <TabsTrigger value="manage-bookings" title="Update and manage booking statuses">
            <span className="flex items-center gap-2">
              Manage Bookings
              {!loadingBookings && pendingApprovalsCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                  {pendingApprovalsCount}
                </Badge>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="handover" title="Coordinate equipment pickup and drop-off between clubs">
            <span className="flex items-center gap-2">
              Pickup & Drop-off
              {!loadingBookings && handoverActionsCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                  {handoverActionsCount}
                </Badge>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="automations" title="Configure automatic booking approvals and notifications">
            Automations
          </TabsTrigger>
          <TabsTrigger value="pricing" title="Configure pricing rules for equipment">
            Pricing
          </TabsTrigger>
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
                          title="Edit equipment"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditHomeLocation(item)}
                          title="Set zone home location"
                          className={item.homeLocation ? "text-primary" : "text-muted-foreground"}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEquipment(item.id)}
                          title="Delete equipment"
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
                        <Badge variant={getStatusBadgeVariant(booking.status)} className={getStatusBadgeColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedBooking(booking);
                                setEditingBooking(false);
                                setBookingDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
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
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Booking
                            </DropdownMenuItem>
                            {booking.status === 'pending' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleApproveBooking(booking.id)}
                                  className="text-green-600"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRejectBooking(booking.id)}
                                  className="text-orange-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteBooking(booking.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Booking
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                            <Badge variant={getStatusBadgeVariant(booking.status)} className={getStatusBadgeColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setEditingBooking(false);
                                    setBookingDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
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
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Booking
                                </DropdownMenuItem>
                                {booking.status === 'pending' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleApproveBooking(booking.id)}
                                      className="text-green-600"
                                    >
                                      <Check className="h-4 w-4 mr-2" />
                                      Approve Booking
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleRejectBooking(booking.id)}
                                      className="text-orange-600"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Reject Booking
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="text-orange-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel Booking
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteBooking(booking.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Booking
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                              <Badge variant={getStatusBadgeVariant(booking.status)} className={`text-xs ${getStatusBadgeColor(booking.status)}`}>
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
                        <div className="mb-6">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                              <MapPin className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Pickup From</p>
                              <p className="font-bold text-lg">{handoverChain.previous.clubName}</p>
                            </div>
                          </div>
                          <Card className="ml-16 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-md">
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
                          {/* Connector */}
                          <div className="ml-6 flex flex-col items-center py-3">
                            <div className="h-6 w-1 bg-gradient-to-b from-blue-400 to-green-400 rounded-full"></div>
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center shadow-md my-1">
                              <ArrowRight className="h-5 w-5 text-white rotate-90" />
                            </div>
                            <div className="h-6 w-1 bg-gradient-to-b from-green-400 to-green-500 rounded-full"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-6">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl flex items-center justify-center shadow-lg">
                              <Package className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pickup From</p>
                              <p className="font-bold text-lg text-slate-700">Zone Storage</p>
                            </div>
                          </div>
                          <Card className="ml-16 border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100/50 shadow-md">
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground mb-3">Equipment will be collected from zone storage location</p>
                              {equipmentHomeLocation && (
                                <div className="mt-3 pt-3 border-t space-y-3">
                                  {equipmentHomeLocation.photo && (
                                    <img src={equipmentHomeLocation.photo} alt="Storage Location" className="w-full max-w-sm rounded-lg border-2 border-slate-200" />
                                  )}
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700 mb-1">Storage Location:</p>
                                    <p className="text-xs text-slate-600">{equipmentHomeLocation.address}</p>
                                    {equipmentHomeLocation.accessInstructions && (
                                      <p className="text-xs text-slate-600 mt-1"><span className="font-semibold">Access:</span> {equipmentHomeLocation.accessInstructions}</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700 mb-1">Contact for Access:</p>
                                    <p className="text-xs text-slate-600">{equipmentHomeLocation.contactPerson.name}{equipmentHomeLocation.contactPerson.role && ` (${equipmentHomeLocation.contactPerson.role})`}</p>
                                    <p className="text-xs text-slate-600">{equipmentHomeLocation.contactPerson.phone}</p>
                                    <p className="text-xs text-slate-600">{equipmentHomeLocation.contactPerson.email}</p>
                                    {equipmentHomeLocation.availabilityNotes && (
                                      <p className="text-xs text-slate-600 mt-1"><span className="font-semibold">Availability:</span> {equipmentHomeLocation.availabilityNotes}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                          <div className="ml-6 flex flex-col items-center py-3">
                            <div className="h-6 w-1 bg-gradient-to-b from-slate-400 to-green-400 rounded-full"></div>
                            <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-green-400 rounded-full flex items-center justify-center shadow-md my-1">
                              <ArrowRight className="h-5 w-5 text-white rotate-90" />
                            </div>
                            <div className="h-6 w-1 bg-gradient-to-b from-green-400 to-green-500 rounded-full"></div>
                          </div>
                        </div>
                      )}

                      {/* Current Booking */}
                      <div className="mb-6">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-green-300">
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Your Booking</p>
                            <p className="font-bold text-lg">{handoverChain.current.clubName}</p>
                          </div>
                        </div>
                        <Card className="ml-16 border-green-400 bg-gradient-to-br from-green-50 to-emerald-100/50 ring-2 ring-green-400 shadow-lg">
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
                        <div className="ml-6 flex flex-col items-center py-3">
                          <div className="h-6 w-1 bg-gradient-to-b from-green-500 to-purple-400 rounded-full"></div>
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-purple-400 rounded-full flex items-center justify-center shadow-md my-1">
                            <ArrowRight className="h-5 w-5 text-white rotate-90" />
                          </div>
                          <div className="h-6 w-1 bg-gradient-to-b from-purple-400 to-purple-500 rounded-full"></div>
                        </div>
                      </div>

                      {/* Next Booking (Drop-off To) */}
                      {handoverChain.next ? (
                        <div>
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                              <MapPin className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Drop-off To</p>
                              <p className="font-bold text-lg">{handoverChain.next.clubName}</p>
                            </div>
                          </div>
                          <Card className="ml-16 border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-md">
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
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl flex items-center justify-center shadow-lg">
                              <Package className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Drop-off To</p>
                              <p className="font-bold text-lg text-slate-700">Zone Storage</p>
                            </div>
                          </div>
                          <Card className="ml-16 border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100/50 shadow-md">
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground mb-3">Equipment will be returned to zone storage location</p>
                              {equipmentHomeLocation && (
                                <div className="mt-3 pt-3 border-t space-y-3">
                                  {equipmentHomeLocation.photo && (
                                    <img src={equipmentHomeLocation.photo} alt="Storage Location" className="w-full max-w-sm rounded-lg border-2 border-slate-200" />
                                  )}
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700 mb-1">Storage Location:</p>
                                    <p className="text-xs text-slate-600">{equipmentHomeLocation.address}</p>
                                    {equipmentHomeLocation.accessInstructions && (
                                      <p className="text-xs text-slate-600 mt-1"><span className="font-semibold">Access:</span> {equipmentHomeLocation.accessInstructions}</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700 mb-1">Contact for Access:</p>
                                    <p className="text-xs text-slate-600">{equipmentHomeLocation.contactPerson.name}{equipmentHomeLocation.contactPerson.role && ` (${equipmentHomeLocation.contactPerson.role})`}</p>
                                    <p className="text-xs text-slate-600">{equipmentHomeLocation.contactPerson.phone}</p>
                                    <p className="text-xs text-slate-600">{equipmentHomeLocation.contactPerson.email}</p>
                                    {equipmentHomeLocation.availabilityNotes && (
                                      <p className="text-xs text-slate-600 mt-1"><span className="font-semibold">Availability:</span> {equipmentHomeLocation.availabilityNotes}</p>
                                    )}
                                  </div>
                                </div>
                              )}
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

        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-6">
          {/* Auto-Approval Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Automatic Booking Approvals
                  </CardTitle>
                  <CardDescription>
                    Automatically approve bookings when there are no scheduling conflicts
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="auto-approval-toggle" className="text-sm font-medium">
                    {autoApprovalEnabled ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch
                    id="auto-approval-toggle"
                    checked={autoApprovalEnabled}
                    onCheckedChange={toggleAutoApproval}
                    disabled={loadingAutoApproval}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How Auto-Approval Works</h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                        <li>When enabled, pending bookings are automatically checked for conflicts</li>
                        <li>If no date conflicts exist for the same equipment, the booking is approved instantly</li>
                        <li>Conflicting bookings still require manual approval from the zone manager</li>
                        <li>All auto-approved bookings are logged in the history below</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {autoApprovalEnabled && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Auto-approval is currently active. New non-conflicting bookings will be approved automatically.
                      </p>
                    </div>
                  </div>
                )}

                {/* Auto-Approved Bookings History */}
                {autoApprovedBookings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Recent Auto-Approved Bookings ({autoApprovedBookings.length})</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Equipment</TableHead>
                            <TableHead>Club</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Auto-Approved</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {autoApprovedBookings.slice(0, 5).map((booking) => {
                            const pickupDate = booking.pickupDate ? new Date(booking.pickupDate) : null;
                            const returnDate = booking.returnDate ? new Date(booking.returnDate) : null;
                            const isValidPickup = pickupDate && !isNaN(pickupDate.getTime());
                            const isValidReturn = returnDate && !isNaN(returnDate.getTime());
                            const approvedDate = booking.approvedAt ? new Date(booking.approvedAt) : null;
                            const isValidApproved = approvedDate && !isNaN(approvedDate.getTime());
                            
                            return (
                              <TableRow key={booking.id}>
                                <TableCell className="font-medium">{booking.equipmentName}</TableCell>
                                <TableCell>{booking.clubName}</TableCell>
                                <TableCell className="text-sm">
                                  {isValidPickup && isValidReturn ? (
                                    `${format(pickupDate, 'MMM d')} - ${format(returnDate, 'MMM d')}`
                                  ) : (
                                    'Invalid date'
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {isValidApproved ? format(approvedDate, 'MMM d, h:mm a') : '-'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(booking.status)} className={getStatusBadgeColor(booking.status)}>
                                    {booking.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Auto-Email Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Automatic Email Confirmations
                  </CardTitle>
                  <CardDescription>
                    Automatically send confirmation emails when bookings are approved
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="auto-email-toggle" className="text-sm font-medium">
                    {autoEmailEnabled ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch
                    id="auto-email-toggle"
                    checked={autoEmailEnabled}
                    onCheckedChange={toggleAutoEmail}
                    disabled={loadingAutoEmail}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How Auto-Email Works</h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                        <li>When enabled, confirmation emails are sent automatically when bookings are approved</li>
                        <li>Emails are sent to the club custodian and backup contact</li>
                        <li>Includes booking details, equipment information, and pickup/return instructions</li>
                        <li>Works with both manual and automatic approvals</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {autoEmailEnabled && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Auto-email is currently active. Confirmation emails will be sent automatically upon booking approval.
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Email Template</h4>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Confirmation emails include: booking reference, equipment details, pickup/return dates and locations, custodian information, and zone contact details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
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
                      <Badge variant={getStatusBadgeVariant(selectedBooking.status)} className={getStatusBadgeColor(selectedBooking.status)}>
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

      {/* Home Location Dialog */}
      <Dialog open={homeLocationDialogOpen} onOpenChange={setHomeLocationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Zone Home Location
            </DialogTitle>
            <DialogDescription>
              Set the default storage location and contact details for {editingHomeLocationFor?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Address Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Storage Location</h3>
              
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="address"
                  value={homeLocationForm.address}
                  onChange={(e) => setHomeLocationForm({ ...homeLocationForm, address: e.target.value })}
                  placeholder="e.g., 123 Main Street, Suburb, State, Postcode"
                  rows={2}
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo" className="text-sm font-medium">
                  Photo URL (Optional)
                </Label>
                <Input
                  id="photo"
                  value={homeLocationForm.photo}
                  onChange={(e) => setHomeLocationForm({ ...homeLocationForm, photo: e.target.value })}
                  placeholder="https://example.com/storage-photo.jpg"
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">URL to a photo of the storage location</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessInstructions" className="text-sm font-medium">
                  Access Instructions (Optional)
                </Label>
                <Textarea
                  id="accessInstructions"
                  value={homeLocationForm.accessInstructions}
                  onChange={(e) => setHomeLocationForm({ ...homeLocationForm, accessInstructions: e.target.value })}
                  placeholder="e.g., Enter through side gate, equipment stored in shed at rear"
                  rows={3}
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availabilityNotes" className="text-sm font-medium">
                  Availability Notes (Optional)
                </Label>
                <Textarea
                  id="availabilityNotes"
                  value={homeLocationForm.availabilityNotes}
                  onChange={(e) => setHomeLocationForm({ ...homeLocationForm, availabilityNotes: e.target.value })}
                  placeholder="e.g., Available Mon-Fri 9am-5pm, weekends by appointment"
                  rows={2}
                  className="text-base"
                />
              </div>
            </div>

            {/* Contact Person Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Contact Person</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="text-sm font-medium">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contactName"
                    value={homeLocationForm.contactName}
                    onChange={(e) => setHomeLocationForm({ ...homeLocationForm, contactName: e.target.value })}
                    placeholder="Contact person name"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactRole" className="text-sm font-medium">
                    Role (Optional)
                  </Label>
                  <Input
                    id="contactRole"
                    value={homeLocationForm.contactRole}
                    onChange={(e) => setHomeLocationForm({ ...homeLocationForm, contactRole: e.target.value })}
                    placeholder="e.g., Equipment Manager"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-sm font-medium">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contactPhone"
                    value={homeLocationForm.contactPhone}
                    onChange={(e) => setHomeLocationForm({ ...homeLocationForm, contactPhone: e.target.value })}
                    placeholder="0400 000 000"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-sm font-medium">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={homeLocationForm.contactEmail}
                    onChange={(e) => setHomeLocationForm({ ...homeLocationForm, contactEmail: e.target.value })}
                    placeholder="contact@example.com"
                    className="text-base"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setHomeLocationDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveHomeLocation}
              disabled={!homeLocationForm.address || !homeLocationForm.contactName || !homeLocationForm.contactPhone || !homeLocationForm.contactEmail}
            >
              Save Home Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
