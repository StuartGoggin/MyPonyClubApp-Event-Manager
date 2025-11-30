/**
 * Equipment Rental Management System - Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the equipment
 * rental tracking system including inventory, bookings, pricing, and handovers.
 */

// ============================================================================
// CORE EQUIPMENT TYPES
// ============================================================================

export type EquipmentCategory = 
  | 'jumps' 
  | 'tent' 
  | 'trailer' 
  | 'sound_system'
  | 'marquee'
  | 'arena_equipment'
  | 'safety_equipment'
  | 'other';

export type EquipmentCondition = 
  | 'excellent' 
  | 'good' 
  | 'fair' 
  | 'needs_repair' 
  | 'unavailable';

export type EquipmentAvailability = 
  | 'available' 
  | 'booked' 
  | 'maintenance' 
  | 'retired';

export type PricingType = 'per_day' | 'flat_fee';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface MaintenanceSchedule {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'as_needed';
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceNotes?: string;
}

export interface ZoneHomeLocation {
  address: string;
  coordinates?: GeoLocation;
  photo?: string; // URL to photo of storage location
  accessInstructions?: string; // e.g., "Behind clubhouse, use side gate"
  contactPerson: {
    name: string;
    phone: string;
    email: string;
    role?: string; // e.g., "Equipment Manager", "Zone Rep"
  };
  availabilityNotes?: string; // e.g., "Available Mon-Fri 9am-5pm"
}

export interface EquipmentItem {
  id: string;
  zoneId: string;
  zoneName?: string; // Denormalized for easy display
  
  // Basic information
  name: string;
  category: EquipmentCategory;
  description: string;
  serialNumber?: string;
  condition: EquipmentCondition;
  
  // Physical details
  quantity: number; // For items with multiple units (e.g., 10 jumps)
  storageLocation: string; // Simple text description for backward compatibility
  homeLocation?: ZoneHomeLocation; // Detailed home location with contact info
  dimensions?: string;
  weight?: string;
  requiresTrailer: boolean;
  
  // Availability
  availability: EquipmentAvailability;
  status: EquipmentAvailability; // Alias for backward compatibility
  currentLocation?: GeoLocation;
  lastUsedLocation?: GeoLocation;
  specifications?: Record<string, any>; // Optional technical specs
  
  // Images
  images: string[]; // URLs to equipment photos
  icon?: string; // Emoji or icon representing the equipment (e.g., 🏇, 🎪, 🚚)
  
  // Maintenance
  maintenanceSchedule?: MaintenanceSchedule;
  lastInspectionDate?: Date;
  nextInspectionDue?: Date;
  
  // Pricing
  pricingType?: PricingType; // 'per_day' or 'flat_fee'
  basePricePerDay: number;
  basePricePerWeek: number;
  depositRequired: number;
  bondAmount?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export type BookingStatus = 
  | 'pending'      // Awaiting zone approval
  | 'approved'     // Approved but not yet confirmed pickup
  | 'confirmed'    // Pickup details confirmed
  | 'picked_up'    // Equipment collected by custodian
  | 'in_use'       // Currently being used at event
  | 'returned'     // Equipment returned
  | 'cancelled'    // Booking cancelled
  | 'overdue';     // Past return date without return confirmation

export type PaymentStatus = 
  | 'unpaid' 
  | 'deposit_paid' 
  | 'partially_paid' 
  | 'paid' 
  | 'overdue' 
  | 'refunded';

export type PickupMethod = 
  | 'collect_from_previous' 
  | 'collect_from_storage' 
  | 'zone_delivery';

export type ReturnMethod = 
  | 'handover_to_next' 
  | 'return_to_storage' 
  | 'zone_collection';

export interface CustodianInfo {
  name: string;
  email: string;
  phone: string;
  licenseNumber?: string; // For trailers/vehicles
  clubRole?: string;
}

export interface HandoverLocation {
  address: string;
  coordinates: GeoLocation;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes?: string;
  isStorageLocation?: boolean;
}

export interface HandoverParty {
  name: string;
  email: string;
  phone: string;
  clubName: string;
  bookingReference: string;
  eventName?: string;
  scheduledDate?: Date;
}

export interface PickupDetails {
  // Who has it before this booking
  previousCustodian?: HandoverParty;
  
  // Where to collect from
  location: HandoverLocation;
  
  // Timing
  scheduledDate: Date;
  scheduledTime?: string; // e.g., "10:00 AM - 12:00 PM"
  confirmedDate?: Date;
  pickupMethod: PickupMethod;
}

export interface ReturnDetails {
  // Who gets it after this booking
  nextCustodian?: HandoverParty;
  
  // Where to return to
  location: HandoverLocation;
  
  // Timing
  scheduledDate: Date;
  scheduledTime?: string;
  confirmedDate?: Date;
  returnMethod: ReturnMethod;
}

export interface HandoverDetails {
  pickup: PickupDetails;
  return: ReturnDetails;
  handoverChanges: HandoverChange[];
  lastNotificationSent?: Date;
}

export interface EquipmentConditionReport {
  condition: EquipmentCondition;
  notes?: string;
  photos?: string[]; // URLs to condition photos
  reportedBy: string;
  reportedAt: Date;
}

export interface DamageReport {
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  photos?: string[];
  estimatedRepairCost?: number;
  reportedBy: string;
  reportedAt: Date;
  resolved: boolean;
  resolutionNotes?: string;
}

export interface ChargeItem {
  description: string;
  amount: number;
  category: 'damage' | 'late_fee' | 'cleaning' | 'other';
}

export interface DiscountItem {
  description: string;
  amount: number;
  percentage?: number;
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'other';
  reference?: string;
  notes?: string;
}

export interface PricingBreakdown {
  baseRate: number;
  clubSpecificRate?: number;
  durationMultiplier: number;
  subtotal: number;
  deposit: number;
  bond?: number;
  additionalCharges?: ChargeItem[];
  discounts?: DiscountItem[];
  totalCharge: number;
}

export interface EquipmentBooking {
  id: string;
  bookingReference: string; // e.g., "EQ-2025-001"
  
  // Equipment & Zone
  equipmentId: string;
  equipmentName: string; // Denormalized for easy display
  equipmentCategory?: EquipmentCategory;
  zoneId: string;
  zoneName: string;
  
  // Club & Event
  clubId: string;
  clubName: string;
  linkedEventId?: string; // Optional - if booked with an event
  eventName?: string;
  
  // Dates
  requestedDate: Date;
  pickupDate: Date;
  returnDate: Date;
  actualPickupDate?: Date;
  actualReturnDate?: Date;
  durationDays: number;
  
  // Responsible Person
  custodian: CustodianInfo;
  
  // Backup contact (if custodian unavailable)
  backupContact?: {
    name: string;
    email: string;
    phone: string;
  };
  
  // Locations
  pickupLocation: HandoverLocation;
  returnLocation: HandoverLocation;
  useLocation: GeoLocation & {
    address: string;
    eventName?: string;
  };
  
  // Status
  status: BookingStatus;
  
  // Approval workflow
  requestedBy: string;
  requestedByEmail: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  autoApproved?: boolean; // True if approved automatically without manual intervention
  
  // Condition tracking
  conditionAtPickup?: EquipmentConditionReport;
  conditionAtReturn?: EquipmentConditionReport;
  damageReported?: DamageReport;
  
  // Financial
  pricing: PricingBreakdown;
  pricingType?: PricingType; // Denormalized from equipment for email templates
  paymentStatus: PaymentStatus;
  payments: Payment[];
  
  // Handover management
  // NOTE: Handover details are NEVER stored in database
  // They are computed dynamically via computeHandoverDetails() when needed
  // This field exists only for backward compatibility with old code
  // DO NOT write to this field - it will be ignored
  handover?: HandoverDetails;
  
  // Notes & special requirements
  specialRequirements?: string;
  internalNotes?: string; // Zone manager notes
  clubNotes?: string;
  
  // Conflict tracking
  conflictDetected?: boolean; // True if this booking overlaps with other bookings
  conflictingBookings?: Array<{
    id: string;
    bookingReference: string;
    clubName: string;
    custodianName?: string;
    pickupDate: Date;
    returnDate: Date;
  }>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PRICING TYPES
// ============================================================================

export interface SeasonalPricing {
  startDate: string; // MM-DD format
  endDate: string;
  multiplier: number; // e.g., 1.5 for peak season
}

export interface PricingRule {
  id: string;
  zoneId: string;
  
  // Applies to
  equipmentId?: string; // Specific equipment or null for category-wide
  category?: EquipmentCategory; // Apply to all in category
  
  // Club-specific pricing
  clubId?: string; // Null = applies to all clubs
  clubName?: string;
  
  // Pricing
  pricePerDay?: number;
  pricePerWeek?: number;
  discountPercentage?: number; // e.g., 10% off for affiliated clubs
  minimumCharge?: number;
  
  // Conditions
  seasonalPricing?: SeasonalPricing;
  
  // Validity
  validFrom?: Date;
  validUntil?: Date;
  active: boolean;
  
  // Metadata
  createdAt: Date;
  createdBy: string;
}

// ============================================================================
// LOCATION & HANDOVER TRACKING
// ============================================================================

export type MovementType = 
  | 'pickup' 
  | 'in_use' 
  | 'returned' 
  | 'maintenance' 
  | 'storage';

export interface LocationHistory {
  id: string;
  equipmentId: string;
  bookingId?: string;
  
  location: GeoLocation;
  locationName: string;
  eventName?: string;
  
  timestamp: Date;
  recordedBy: string;
  
  // For visualization
  movementType: MovementType;
}

export type HandoverChangeType = 
  | 'pickup_location_changed' 
  | 'return_location_changed' 
  | 'new_booking_before' 
  | 'new_booking_after' 
  | 'booking_cancelled' 
  | 'custodian_changed';

export interface HandoverChange {
  id: string;
  bookingId: string;
  equipmentId: string;
  
  changeType: HandoverChangeType;
  
  timestamp: Date;
  triggeredBy: string; // User who made the change or 'system'
  
  // What changed
  previousValue?: any;
  newValue?: any;
  
  // Impact
  affectedBookings: string[]; // IDs of bookings impacted by this change
  
  // Notifications
  notificationsSent: {
    to: string; // email address
    sentAt: Date;
    type: 'pickup_change' | 'return_change' | 'handover_update';
  }[];
}

// ============================================================================
// EQUIPMENT CUSTODIAN (ZONE STORAGE MANAGER)
// ============================================================================

export type ContactMethod = 'email' | 'phone' | 'sms';

export interface EquipmentCustodian {
  id: string;
  equipmentId?: string; // If null, custodian manages all equipment for zone
  zoneId: string;
  
  // Person responsible when equipment at storage
  name: string;
  role: string; // e.g., "Zone Equipment Manager"
  email: string;
  phone: string;
  
  // Storage location
  storageAddress: string;
  storageLocation: GeoLocation;
  accessInstructions: string; // e.g., "Storage shed behind clubhouse"
  
  // Availability
  availableHours?: string; // e.g., "Mon-Fri 9am-5pm, Sat 9am-12pm"
  preferredContactMethod: ContactMethod;
  
  // Status
  active: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateEquipmentRequest {
  zoneId: string;
  name: string;
  category: EquipmentCategory;
  description: string;
  icon?: string;
  quantity: number;
  basePricePerDay: number;
  basePricePerWeek: number;
  depositRequired: number;
  bondAmount?: number;
  requiresTrailer: boolean;
  storageLocation: string;
  images?: string[];
  pricingType?: PricingType;
}

export interface CreateBookingRequest {
  equipmentId: string;
  clubId: string;
  linkedEventId?: string;
  eventName?: string; // Direct event name (used if no linkedEventId)
  pickupDate: Date;
  returnDate: Date;
  custodian: CustodianInfo;
  backupContact?: {
    name: string;
    email: string;
    phone: string;
  };
  useLocation: {
    address: string;
    coordinates: GeoLocation;
  };
  specialRequirements?: string;
  clubNotes?: string;
}

export interface BookingChainItem extends EquipmentBooking {
  position: number; // Position in the chain (1, 2, 3...)
  isFirst: boolean;
  isLast: boolean;
}

export interface EquipmentAvailabilityCheck {
  equipmentId: string;
  startDate: Date;
  endDate: Date;
  available: boolean;
  conflictingBookings?: {
    id: string;
    bookingReference: string;
    pickupDate: Date;
    returnDate: Date;
    clubName: string;
  }[];
}

// ============================================================================
// MAP VISUALIZATION TYPES
// ============================================================================

export type MapMarkerStatus = 
  | 'storage' 
  | 'in_use' 
  | 'in_transit' 
  | 'overdue';

export interface MapEquipmentMarker {
  equipmentId: string;
  equipmentName: string;
  category: EquipmentCategory;
  currentLocation: GeoLocation;
  status: MapMarkerStatus;
  bookingId?: string;
  clubName?: string;
  eventName?: string;
  nextDestination?: {
    location: GeoLocation;
    scheduledDate: Date;
    eventName: string;
  };
  lastKnownLocation?: {
    location: GeoLocation;
    timestamp: Date;
    locationName: string;
  };
}

// ============================================================================
// REPORTING TYPES
// ============================================================================

export interface EquipmentUtilizationReport {
  equipmentId: string;
  equipmentName: string;
  category: EquipmentCategory;
  
  totalBookings: number;
  totalDaysBooked: number;
  totalDaysAvailable: number;
  utilizationPercentage: number;
  
  averageBookingDuration: number;
  totalRevenue: number;
  averageRevenuePerBooking: number;
  
  mostCommonClub?: {
    clubId: string;
    clubName: string;
    bookingCount: number;
  };
  
  damageIncidents: number;
  overdueIncidents: number;
}

export interface ClubEquipmentReport {
  clubId: string;
  clubName: string;
  
  totalBookings: number;
  totalSpent: number;
  outstandingPayments: number;
  
  overdueIncidents: number;
  damageIncidents: number;
  
  mostBookedEquipment?: {
    equipmentId: string;
    equipmentName: string;
    bookingCount: number;
  };
  
  paymentHistory: {
    paid: number;
    pending: number;
    overdue: number;
  };
}

export interface FinancialSummary {
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  totalRevenue: number;
  outstandingPayments: number;
  depositsHeld: number;
  bondsForfeited: number;
  
  revenueByCategory: {
    category: EquipmentCategory;
    revenue: number;
    bookingCount: number;
  }[];
  
  revenueByClub: {
    clubId: string;
    clubName: string;
    revenue: number;
    bookingCount: number;
  }[];
}
