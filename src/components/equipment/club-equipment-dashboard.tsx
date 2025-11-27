'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Edit, X, ArrowRight, Truck, User, MapPin, Package, Printer, Mail, ShoppingCart, Calendar, ArrowDownToLine } from 'lucide-react';
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
  const [upcomingBookingsCount, setUpcomingBookingsCount] = useState(0);
  const [upcomingPickupsCount, setUpcomingPickupsCount] = useState(0);
  
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

  // Fetch bookings function
  const fetchBookings = useCallback(async () => {
    try {
      setLoadingBookings(true);
      const response = await fetch(`/api/equipment-bookings?clubId=${clubId}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      const fetchedBookings = data.data || [];
      setBookings(fetchedBookings);
      
      // Calculate upcoming bookings and pickups
      const now = new Date();
      const upcoming = fetchedBookings.filter((b: EquipmentBooking) => {
        const pickupDate = b.pickupDate ? new Date(b.pickupDate) : null;
        return pickupDate && pickupDate > now && (b.status === 'confirmed' || b.status === 'pending');
      });
      setUpcomingBookingsCount(upcoming.length);
      
      // Count upcoming pickups (within next 7 days)
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const upcomingPickups = fetchedBookings.filter((b: EquipmentBooking) => {
        const pickupDate = b.pickupDate ? new Date(b.pickupDate) : null;
        return pickupDate && pickupDate > now && pickupDate <= weekFromNow && (b.status === 'confirmed' || b.status === 'pending');
      });
      setUpcomingPickupsCount(upcomingPickups.length);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive',
      });
    } finally {
      setLoadingBookings(false);
    }
  }, [clubId, toast]);

  // Fetch bookings on initial mount to populate indicators
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Fetch bookings when switching to booking tabs (refresh)
  useEffect(() => {
    if (activeTab === 'my-bookings' || activeTab === 'handover') {
      fetchBookings();
    }
  }, [activeTab, fetchBookings]);

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
            @page { 
              size: A4 portrait; 
              margin: 15mm; 
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
              margin: 20px; 
              color: #1e293b;
              line-height: 1.4;
              font-size: 11px;
            }
            .header { 
              margin-bottom: 12px; 
              padding-bottom: 8px; 
              border-bottom: 2px solid #e2e8f0; 
            }
            h1 { 
              font-size: 18px; 
              font-weight: 700; 
              color: #0f172a; 
              margin-bottom: 6px;
            }
            .meta { 
              display: flex; 
              gap: 16px; 
              font-size: 10px; 
              color: #64748b; 
              margin-top: 4px;
            }
            .meta-item { font-weight: 500; }
            .meta-item strong { color: #334155; }
            
            .handover-flow { margin: 8px 0; }
            .flow-section { 
              margin: 10px 0; 
              page-break-inside: avoid;
            }
            .section-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 6px;
            }
            .section-icon {
              width: 32px;
              height: 32px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              font-weight: 700;
              color: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              flex-shrink: 0;
            }
            .pickup-icon { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
            .current-icon { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
            .dropoff-icon { background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); }
            .storage-icon { background: linear-gradient(135deg, #64748b 0%, #475569 100%); }
            
            .section-title {
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
            }
            
            .card {
              background: white;
              border-radius: 8px;
              padding: 10px 12px;
              box-shadow: 0 1px 2px rgba(0,0,0,0.05);
              border: 1px solid #e2e8f0;
            }
            .card.current {
              background: linear-gradient(to bottom right, #f0fdf4 0%, #dcfce7 100%);
              border: 2px solid #10b981;
              box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
            }
            .card.pickup { border-left: 3px solid #3b82f6; }
            .card.dropoff { border-left: 3px solid #a855f7; }
            .card.storage { 
              background: linear-gradient(to bottom right, #f8fafc 0%, #f1f5f9 100%);
              border-left: 3px solid #64748b; 
            }
            
            .info-group { margin: 8px 0; }
            .info-group:first-child { margin-top: 0; }
            .info-group:last-child { margin-bottom: 0; }
            
            .info-row {
              display: flex;
              padding: 3px 0;
              font-size: 10px;
            }
            .label { 
              font-weight: 600; 
              color: #475569;
              min-width: 90px;
            }
            .value { 
              color: #0f172a;
              flex: 1;
            }
            
            .contact-box {
              background: linear-gradient(to bottom right, #f8fafc 0%, #f1f5f9 100%);
              border-radius: 6px;
              padding: 8px 10px;
              margin: 6px 0;
              border: 1px solid #e2e8f0;
            }
            .current .contact-box {
              background: linear-gradient(to bottom right, #ecfdf5 0%, #d1fae5 100%);
              border-color: #86efac;
            }
            .contact-title {
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 4px;
              font-size: 11px;
            }
            
            .storage-notice {
              padding: 12px;
              background: linear-gradient(to bottom right, #f8fafc 0%, #f1f5f9 100%);
              border-radius: 6px;
              border: 2px dashed #cbd5e1;
              text-align: center;
            }
            .storage-title { 
              font-weight: 700; 
              font-size: 12px;
              color: #334155;
              margin-bottom: 4px;
            }
            .storage-text { 
              color: #64748b;
              font-size: 10px;
            }
            
            .connector {
              margin: 6px 0;
              text-align: center;
              height: 20px;
            }
            .connector-line {
              width: 2px;
              height: 8px;
              background: linear-gradient(to bottom, #cbd5e1 0%, #94a3b8 100%);
              margin: 0 auto;
            }
            .connector-dot {
              width: 8px;
              height: 8px;
              background: #94a3b8;
              border-radius: 50%;
              margin: 2px auto;
            }
            
            button {
              margin-top: 16px;
              padding: 10px 20px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              border: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 13px;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
            }
            button:hover {
              background: linear-gradient(135deg, #059669 0%, #047857 100%);
            }
            
            @media print { 
              body { margin: 0; }
              button { display: none; }
              .card { 
                box-shadow: none;
                border: 1px solid #cbd5e1 !important;
              }
              .card.current { border: 2px solid #10b981 !important; }
              .section-icon { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Equipment Handover Details</h1>
            <div class="meta">
              <span class="meta-item"><strong>Equipment:</strong> ${handoverChain.current.equipmentName}</span>
              <span class="meta-item"><strong>Club:</strong> ${clubName}</span>
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
                  <div class="storage-notice">
                    <div class="storage-title">Zone Storage</div>
                    <div class="storage-text">Equipment will be collected from the zone storage location</div>
                  </div>
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
                <div class="section-title">Your Booking</div>
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
                  <div class="storage-notice">
                    <div class="storage-title">Zone Storage</div>
                    <div class="storage-text">Equipment will be returned to the zone storage location</div>
                  </div>
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
          contextName: clubName,
          contextType: 'club',
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
                    <strong style="color: #334155;">Club:</strong> ${clubName}
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
                          Your Booking
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
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'returned': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section - Cleaner, More Compact */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Book Zone Equipment</h1>
            <p className="text-sm text-muted-foreground">
              Browse and request equipment from {zoneName}
            </p>
          </div>
        </div>
        
        {/* Club and Zone Info - Compact Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full text-sm">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{clubName}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full text-sm">
            <Package className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-primary">{zoneName}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm mb-6">
              <TabsTrigger value="browse" title="Browse available equipment and create bookings">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Browse & Book
              </TabsTrigger>
              <TabsTrigger value="my-bookings" title="View and manage your equipment bookings">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="flex items-center gap-2">
                  My Bookings
                  {upcomingBookingsCount > 0 && (
                    <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0 h-4">
                      {upcomingBookingsCount}
                    </Badge>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger value="handover" title="Coordinate equipment pickup and drop-off">
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                <span className="flex items-center gap-2">
                  Pickup & Drop-off
                  {upcomingPickupsCount > 0 && (
                    <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0 h-4">
                      {upcomingPickupsCount}
                    </Badge>
                  )}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-4">
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
                              <p className="text-sm text-muted-foreground">Equipment will be collected from zone storage location</p>
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
        </div>
      </div>

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
