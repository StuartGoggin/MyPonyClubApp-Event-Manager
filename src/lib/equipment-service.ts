/**
 * Equipment Rental Management - Database Service Layer
 * 
 * This service handles all Firestore operations for equipment management,
 * including inventory, bookings, pricing rules, and handover tracking.
 */

import { adminDb } from './firebase-admin';
import {
  EquipmentItem,
  EquipmentBooking,
  PricingRule,
  EquipmentCustodian,
  LocationHistory,
  HandoverChange,
  CreateEquipmentRequest,
  CreateBookingRequest,
  EquipmentAvailabilityCheck,
  BookingChainItem,
  EquipmentUtilizationReport,
  ClubEquipmentReport,
  FinancialSummary,
  PricingBreakdown,
  HandoverDetails,
  PickupDetails,
  ReturnDetails,
  HandoverLocation,
} from '@/types/equipment';
import { addDays, differenceInDays, isBefore, isAfter, isWithinInterval } from 'date-fns';

// Use adminDb as db for consistency with existing code
const db = adminDb;

// ============================================================================
// FIRESTORE COLLECTIONS
// ============================================================================

const EQUIPMENT_COLLECTION = 'equipment-items';
const BOOKINGS_COLLECTION = 'equipment-bookings';
const PRICING_RULES_COLLECTION = 'equipment-pricing-rules';
const CUSTODIANS_COLLECTION = 'equipment-custodians';
const LOCATION_HISTORY_COLLECTION = 'equipment-location-history';
const HANDOVER_CHANGES_COLLECTION = 'equipment-handover-changes';

// ============================================================================
// EQUIPMENT CRUD OPERATIONS
// ============================================================================

/**
 * Create a new equipment item
 */
export async function createEquipment(
  equipment: CreateEquipmentRequest,
  createdBy: string
): Promise<EquipmentItem> {
  try {
    const newEquipment: Omit<EquipmentItem, 'id'> = {
      ...equipment,
      condition: 'excellent',
      availability: 'available',
      status: 'available',
      images: equipment.images || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    const docRef = await db.collection(EQUIPMENT_COLLECTION).add(newEquipment);
    const created = { id: docRef.id, ...newEquipment };

    console.log(`✅ Equipment created: ${created.name} (${created.id})`);
    return created;
  } catch (error) {
    console.error('Error creating equipment:', error);
    throw error;
  }
}

/**
 * Get equipment by ID
 */
export async function getEquipment(equipmentId: string): Promise<EquipmentItem | null> {
  try {
    const doc = await db.collection(EQUIPMENT_COLLECTION).doc(equipmentId).get();
    
    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, ...doc.data() } as EquipmentItem;
  } catch (error) {
    console.error('Error getting equipment:', error);
    throw error;
  }
}

/**
 * List all equipment (with optional filters)
 */
export async function listEquipment(filters?: {
  zoneId?: string;
  category?: string;
  availability?: string;
}): Promise<EquipmentItem[]> {
  try {
    let query: any = db.collection(EQUIPMENT_COLLECTION);

    if (filters?.zoneId) {
      query = query.where('zoneId', '==', filters.zoneId);
    }

    if (filters?.category) {
      query = query.where('category', '==', filters.category);
    }

    if (filters?.availability) {
      query = query.where('availability', '==', filters.availability);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as EquipmentItem[];
  } catch (error) {
    console.error('Error listing equipment:', error);
    throw error;
  }
}

/**
 * Update equipment
 */
export async function updateEquipment(
  equipmentId: string,
  updates: Partial<EquipmentItem>
): Promise<void> {
  try {
    await db.collection(EQUIPMENT_COLLECTION).doc(equipmentId).update({
      ...updates,
      updatedAt: new Date(),
    });

    console.log(`✅ Equipment updated: ${equipmentId}`);
  } catch (error) {
    console.error('Error updating equipment:', error);
    throw error;
  }
}

/**
 * Delete equipment
 */
export async function deleteEquipment(equipmentId: string): Promise<void> {
  try {
    // Check if equipment has active bookings
    const activeBookings = await db
      .collection(BOOKINGS_COLLECTION)
      .where('equipmentId', '==', equipmentId)
      .where('status', 'in', ['pending', 'approved', 'confirmed', 'picked_up', 'in_use'])
      .get();

    if (!activeBookings.empty) {
      throw new Error('Cannot delete equipment with active bookings');
    }

    await db.collection(EQUIPMENT_COLLECTION).doc(equipmentId).delete();
    console.log(`✅ Equipment deleted: ${equipmentId}`);
  } catch (error) {
    console.error('Error deleting equipment:', error);
    throw error;
  }
}

// ============================================================================
// BOOKING OPERATIONS
// ============================================================================

/**
 * Generate a unique booking reference
 */
function generateBookingReference(): string {
  const timestamp = Date.now();
  return `EQ-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`;
}

/**
 * Check equipment availability for a date range
 */
export async function checkAvailability(
  equipmentId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
): Promise<EquipmentAvailabilityCheck> {
  try {
    let query: any = db
      .collection(BOOKINGS_COLLECTION)
      .where('equipmentId', '==', equipmentId)
      .where('status', 'in', ['pending', 'approved', 'confirmed', 'picked_up', 'in_use']);

    const snapshot = await query.get();
    const bookings = snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }) as EquipmentBooking)
      .filter((booking: any) => booking.id !== excludeBookingId);

    // Check for overlapping bookings
    const conflictingBookings = bookings.filter((booking: any) => {
      const bookingStart = new Date(booking.pickupDate);
      const bookingEnd = new Date(booking.returnDate);
      
      // Check if dates overlap
      return (
        (isBefore(startDate, bookingEnd) && isAfter(endDate, bookingStart)) ||
        (isWithinInterval(startDate, { start: bookingStart, end: bookingEnd })) ||
        (isWithinInterval(endDate, { start: bookingStart, end: bookingEnd }))
      );
    });

    return {
      equipmentId,
      startDate,
      endDate,
      available: conflictingBookings.length === 0,
      conflictingBookings: conflictingBookings.map((b: any) => ({
        id: b.id,
        bookingReference: b.bookingReference,
        pickupDate: b.pickupDate,
        returnDate: b.returnDate,
        clubName: b.clubName,
      })),
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
}

/**
 * Get storage custodian for equipment
 */
async function getStorageCustodian(equipmentId: string, zoneId: string): Promise<EquipmentCustodian | null> {
  try {
    // First try to get equipment-specific custodian
    const equipmentCustodianSnap = await db
      .collection(CUSTODIANS_COLLECTION)
      .where('equipmentId', '==', equipmentId)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (!equipmentCustodianSnap.empty) {
      return { id: equipmentCustodianSnap.docs[0].id, ...equipmentCustodianSnap.docs[0].data() } as EquipmentCustodian;
    }

    // Fall back to zone-wide custodian
    const zoneCustodianSnap = await db
      .collection(CUSTODIANS_COLLECTION)
      .where('zoneId', '==', zoneId)
      .where('equipmentId', '==', null)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (!zoneCustodianSnap.empty) {
      return { id: zoneCustodianSnap.docs[0].id, ...zoneCustodianSnap.docs[0].data() } as EquipmentCustodian;
    }

    return null;
  } catch (error) {
    console.error('Error getting storage custodian:', error);
    return null;
  }
}

/**
 * Find booking that ends just before a given date
 */
async function findBookingEndingBefore(
  equipmentId: string,
  date: Date,
  bufferHours: number = 24
): Promise<EquipmentBooking | null> {
  try {
    const bufferDate = addDays(date, -1); // Look within 1 day before

    const snapshot = await db
      .collection(BOOKINGS_COLLECTION)
      .where('equipmentId', '==', equipmentId)
      .where('status', 'in', ['approved', 'confirmed', 'picked_up', 'in_use'])
      .get();

    const bookings = snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }) as EquipmentBooking)
      .filter((b: EquipmentBooking) => {
        const returnDate = new Date(b.returnDate);
        const hoursDiff = Math.abs(differenceInDays(returnDate, date));
        return isBefore(returnDate, date) && hoursDiff <= 1;
      })
      .sort((a: EquipmentBooking, b: EquipmentBooking) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime());

    return bookings[0] || null;
  } catch (error) {
    console.error('Error finding previous booking:', error);
    return null;
  }
}

/**
 * Find booking that starts just after a given date
 */
async function findBookingStartingAfter(
  equipmentId: string,
  date: Date,
  bufferHours: number = 24
): Promise<EquipmentBooking | null> {
  try {
    const bufferDate = addDays(date, 1); // Look within 1 day after

    const snapshot = await db
      .collection(BOOKINGS_COLLECTION)
      .where('equipmentId', '==', equipmentId)
      .where('status', 'in', ['approved', 'confirmed', 'picked_up', 'in_use'])
      .get();

    const bookings = snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }) as EquipmentBooking)
      .filter((b: EquipmentBooking) => {
        const pickupDate = new Date(b.pickupDate);
        const hoursDiff = Math.abs(differenceInDays(pickupDate, date));
        return isAfter(pickupDate, date) && hoursDiff <= 1;
      })
      .sort((a: EquipmentBooking, b: EquipmentBooking) => new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime());

    return bookings[0] || null;
  } catch (error) {
    console.error('Error finding next booking:', error);
    return null;
  }
}

/**
 * Create handover details for a new booking
 */
async function createHandoverDetails(
  equipmentId: string,
  zoneId: string,
  pickupDate: Date,
  returnDate: Date,
  useLocation: { address: string; coordinates: any }
): Promise<HandoverDetails> {
  const previousBooking = await findBookingEndingBefore(equipmentId, pickupDate);
  const nextBooking = await findBookingStartingAfter(equipmentId, returnDate);
  const storageCustodian = await getStorageCustodian(equipmentId, zoneId);

  // Pickup details
  const pickup: PickupDetails = previousBooking
    ? {
        previousCustodian: {
          name: previousBooking.custodian.name,
          email: previousBooking.custodian.email,
          phone: previousBooking.custodian.phone,
          clubName: previousBooking.clubName,
          bookingReference: previousBooking.bookingReference,
          eventName: previousBooking.eventName,
          scheduledDate: previousBooking.returnDate,
        },
        location: {
          address: previousBooking.useLocation.address,
          coordinates: {
            latitude: previousBooking.useLocation.latitude,
            longitude: previousBooking.useLocation.longitude,
          },
          contactName: previousBooking.custodian.name,
          contactPhone: previousBooking.custodian.phone,
          contactEmail: previousBooking.custodian.email,
        },
        scheduledDate: pickupDate,
        pickupMethod: 'collect_from_previous',
      }
    : {
        location: storageCustodian
          ? {
              address: storageCustodian.storageAddress,
              coordinates: storageCustodian.storageLocation,
              contactName: storageCustodian.name,
              contactPhone: storageCustodian.phone,
              contactEmail: storageCustodian.email,
              notes: storageCustodian.accessInstructions,
              isStorageLocation: true,
            }
          : {
              address: 'Zone Storage',
              coordinates: { latitude: 0, longitude: 0 },
              contactName: 'Zone Manager',
              contactPhone: '',
              contactEmail: '',
              isStorageLocation: true,
            },
        scheduledDate: pickupDate,
        pickupMethod: 'collect_from_storage',
      };

  // Return details
  const returnDetails: ReturnDetails = nextBooking
    ? {
        nextCustodian: {
          name: nextBooking.custodian.name,
          email: nextBooking.custodian.email,
          phone: nextBooking.custodian.phone,
          clubName: nextBooking.clubName,
          bookingReference: nextBooking.bookingReference,
          eventName: nextBooking.eventName,
          scheduledDate: nextBooking.pickupDate,
        },
        location: {
          address: nextBooking.useLocation.address,
          coordinates: {
            latitude: nextBooking.useLocation.latitude,
            longitude: nextBooking.useLocation.longitude,
          },
          contactName: nextBooking.custodian.name,
          contactPhone: nextBooking.custodian.phone,
          contactEmail: nextBooking.custodian.email,
        },
        scheduledDate: returnDate,
        returnMethod: 'handover_to_next',
      }
    : {
        location: storageCustodian
          ? {
              address: storageCustodian.storageAddress,
              coordinates: storageCustodian.storageLocation,
              contactName: storageCustodian.name,
              contactPhone: storageCustodian.phone,
              contactEmail: storageCustodian.email,
              notes: storageCustodian.accessInstructions,
              isStorageLocation: true,
            }
          : {
              address: 'Zone Storage',
              coordinates: { latitude: 0, longitude: 0 },
              contactName: 'Zone Manager',
              contactPhone: '',
              contactEmail: '',
              isStorageLocation: true,
            },
        scheduledDate: returnDate,
        returnMethod: 'return_to_storage',
      };

  return {
    pickup,
    return: returnDetails,
    handoverChanges: [],
  };
}

/**
 * Create a new equipment booking
 */
export async function createBooking(
  request: CreateBookingRequest,
  requestedBy: string,
  requestedByEmail: string
): Promise<EquipmentBooking> {
  try {
    // Check availability
    const availability = await checkAvailability(
      request.equipmentId,
      request.pickupDate,
      request.returnDate
    );

    if (!availability.available) {
      throw new Error('Equipment is not available for the selected dates');
    }

    // Get equipment details
    const equipment = await getEquipment(request.equipmentId);
    if (!equipment) {
      throw new Error('Equipment not found');
    }

    // Get club details
    const clubDoc = await db.collection('clubs').doc(request.clubId).get();
    const clubData = clubDoc.exists ? clubDoc.data() : null;
    const clubName = clubData?.name || 'Unknown Club';

    // Get event details if linked
    let eventName: string | undefined;
    if (request.linkedEventId) {
      const eventDoc = await db.collection('evEvents').doc(request.linkedEventId).get();
      const eventData = eventDoc.exists ? eventDoc.data() : null;
      eventName = eventData?.title || undefined;
    }

    // Calculate duration
    const durationDays = differenceInDays(request.returnDate, request.pickupDate);

    // Calculate pricing
    const pricing = await calculatePricing(
      equipment,
      request.clubId,
      durationDays
    );

    // Create handover details
    const handover = await createHandoverDetails(
      request.equipmentId,
      equipment.zoneId,
      request.pickupDate,
      request.returnDate,
      request.useLocation
    );

    const newBooking: Omit<EquipmentBooking, 'id'> = {
      bookingReference: generateBookingReference(),
      equipmentId: request.equipmentId,
      equipmentName: equipment.name,
      equipmentCategory: equipment.category,
      zoneId: equipment.zoneId,
      zoneName: equipment.zoneName || '',
      clubId: request.clubId,
      clubName: clubName,
      linkedEventId: request.linkedEventId,
      eventName: eventName,
      requestedDate: new Date(),
      pickupDate: request.pickupDate,
      returnDate: request.returnDate,
      durationDays,
      custodian: request.custodian,
      backupContact: request.backupContact,
      pickupLocation: handover.pickup.location,
      returnLocation: handover.return.location,
      useLocation: {
        latitude: request.useLocation.coordinates.latitude,
        longitude: request.useLocation.coordinates.longitude,
        address: request.useLocation.address,
        eventName: eventName,
      },
      status: 'pending',
      requestedBy,
      requestedByEmail,
      pricing,
      paymentStatus: 'unpaid',
      payments: [],
      handover,
      specialRequirements: request.specialRequirements,
      clubNotes: request.clubNotes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection(BOOKINGS_COLLECTION).add(newBooking);
    const created = { id: docRef.id, ...newBooking };

    console.log(`✅ Equipment booking created: ${created.bookingReference}`);
    return created;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

/**
 * Get booking by ID
 */
export async function getBooking(bookingId: string): Promise<EquipmentBooking | null> {
  try {
    const doc = await db.collection(BOOKINGS_COLLECTION).doc(bookingId).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Convert Firestore Timestamps to Date objects
      requestedDate: data?.requestedDate?.toDate?.() || data?.requestedDate,
      pickupDate: data?.pickupDate?.toDate?.() || data?.pickupDate,
      returnDate: data?.returnDate?.toDate?.() || data?.returnDate,
      actualPickupDate: data?.actualPickupDate?.toDate?.() || data?.actualPickupDate,
      actualReturnDate: data?.actualReturnDate?.toDate?.() || data?.actualReturnDate,
      approvedAt: data?.approvedAt?.toDate?.() || data?.approvedAt,
      createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
      updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt,
    } as EquipmentBooking;
  } catch (error) {
    console.error('Error getting booking:', error);
    throw error;
  }
}

/**
 * List bookings (with optional filters)
 */
export async function listBookings(filters?: {
  equipmentId?: string;
  clubId?: string;
  zoneId?: string;
  status?: string;
}): Promise<EquipmentBooking[]> {
  try {
    let query: any = db.collection(BOOKINGS_COLLECTION);

    if (filters?.equipmentId) {
      query = query.where('equipmentId', '==', filters.equipmentId);
    }

    if (filters?.clubId) {
      query = query.where('clubId', '==', filters.clubId);
    }

    if (filters?.zoneId) {
      query = query.where('zoneId', '==', filters.zoneId);
    }

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    const snapshot = await query.orderBy('pickupDate', 'desc').get();
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings for serialization
        requestedDate: data.requestedDate?.toDate?.() || data.requestedDate,
        pickupDate: data.pickupDate?.toDate?.() || data.pickupDate,
        returnDate: data.returnDate?.toDate?.() || data.returnDate,
        actualPickupDate: data.actualPickupDate?.toDate?.() || data.actualPickupDate,
        actualReturnDate: data.actualReturnDate?.toDate?.() || data.actualReturnDate,
        approvedAt: data.approvedAt?.toDate?.() || data.approvedAt,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      };
    }) as EquipmentBooking[];
  } catch (error) {
    console.error('Error listing bookings:', error);
    throw error;
  }
}

/**
 * Update booking
 */
export async function updateBooking(
  bookingId: string,
  updates: Partial<EquipmentBooking>
): Promise<void> {
  try {
    await db.collection(BOOKINGS_COLLECTION).doc(bookingId).update({
      ...updates,
      updatedAt: new Date(),
    });

    console.log(`✅ Booking updated: ${bookingId}`);
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
}

/**
 * Get booking chain for equipment
 */
export async function getBookingChain(
  equipmentId: string,
  startDate: Date,
  endDate: Date
): Promise<BookingChainItem[]> {
  try {
    const snapshot = await db
      .collection(BOOKINGS_COLLECTION)
      .where('equipmentId', '==', equipmentId)
      .where('status', 'in', ['approved', 'confirmed', 'picked_up', 'in_use'])
      .get();

    const bookings = snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }) as EquipmentBooking)
      .filter((b: EquipmentBooking) => {
        const bStart = new Date(b.pickupDate);
        const bEnd = new Date(b.returnDate);
        return (
          isWithinInterval(bStart, { start: startDate, end: endDate }) ||
          isWithinInterval(bEnd, { start: startDate, end: endDate })
        );
      })
      .sort((a: EquipmentBooking, b: EquipmentBooking) => new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime());

    return bookings.map((booking: EquipmentBooking, index: number) => ({
      ...booking,
      position: index + 1,
      isFirst: index === 0,
      isLast: index === bookings.length - 1,
    }));
  } catch (error) {
    console.error('Error getting booking chain:', error);
    throw error;
  }
}

// ============================================================================
// PRICING OPERATIONS
// ============================================================================

/**
 * Calculate pricing for a booking
 */
async function calculatePricing(
  equipment: EquipmentItem,
  clubId: string,
  durationDays: number
): Promise<PricingBreakdown> {
  try {
    // Find applicable pricing rule
    const rules = await db
      .collection(PRICING_RULES_COLLECTION)
      .where('active', '==', true)
      .where('zoneId', '==', equipment.zoneId)
      .get();

    const applicableRules = rules.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }) as PricingRule)
      .filter((rule: any) => {
        // Check if rule applies to this equipment or category
        if (rule.equipmentId && rule.equipmentId !== equipment.id) return false;
        if (rule.category && rule.category !== equipment.category) return false;
        
        // Check if rule applies to this club
        if (rule.clubId && rule.clubId !== clubId) return false;
        
        return true;
      })
      .sort((a: any, b: any) => {
        // Prioritize more specific rules
        if (a.equipmentId && !b.equipmentId) return -1;
        if (!a.equipmentId && b.equipmentId) return 1;
        if (a.clubId && !b.clubId) return -1;
        if (!a.clubId && b.clubId) return 1;
        return 0;
      });

    const rule = applicableRules[0];

    // Base rate
    let ratePerDay = rule?.pricePerDay ?? equipment.basePricePerDay;
    const ratePerWeek = rule?.pricePerWeek ?? equipment.basePricePerWeek;

    // Calculate duration-based pricing
    const weeks = Math.floor(durationDays / 7);
    const remainingDays = durationDays % 7;
    let subtotal = weeks * ratePerWeek + remainingDays * ratePerDay;

    // Apply discounts
    if (rule?.discountPercentage) {
      const discount = subtotal * (rule.discountPercentage / 100);
      subtotal -= discount;
    }

    // Apply minimum charge
    if (rule?.minimumCharge) {
      subtotal = Math.max(subtotal, rule.minimumCharge);
    }

    const deposit = equipment.depositRequired;
    const bond = equipment.bondAmount || 0;
    const totalCharge = subtotal + deposit + bond;

    return {
      baseRate: ratePerDay,
      clubSpecificRate: rule?.clubId ? ratePerDay : undefined,
      durationMultiplier: durationDays,
      subtotal,
      deposit,
      bond: bond > 0 ? bond : undefined,
      totalCharge,
    };
  } catch (error) {
    console.error('Error calculating pricing:', error);
    // Return default pricing
    return {
      baseRate: equipment.basePricePerDay,
      durationMultiplier: durationDays,
      subtotal: equipment.basePricePerDay * durationDays,
      deposit: equipment.depositRequired,
      bond: equipment.bondAmount,
      totalCharge:
        equipment.basePricePerDay * durationDays +
        equipment.depositRequired +
        (equipment.bondAmount || 0),
    };
  }
}

/**
 * Create a pricing rule
 */
export async function createPricingRule(
  rule: Omit<PricingRule, 'id' | 'createdAt'>,
  createdBy: string
): Promise<PricingRule> {
  try {
    const newRule = {
      ...rule,
      active: true,
      createdAt: new Date(),
      createdBy,
    };

    const docRef = await db.collection(PRICING_RULES_COLLECTION).add(newRule);
    const created = { id: docRef.id, ...newRule };

    console.log(`✅ Pricing rule created: ${created.id}`);
    return created;
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    throw error;
  }
}

/**
 * Update a pricing rule
 */
export async function updatePricingRule(
  ruleId: string,
  updates: Partial<PricingRule>
): Promise<PricingRule> {
  try {
    await db.collection(PRICING_RULES_COLLECTION).doc(ruleId).update(updates);
    
    const updated = await db.collection(PRICING_RULES_COLLECTION).doc(ruleId).get();
    const rule = { id: updated.id, ...updated.data() } as PricingRule;
    
    console.log(`✅ Pricing rule updated: ${ruleId}`);
    return rule;
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    throw error;
  }
}

/**
 * Delete a pricing rule
 */
export async function deletePricingRule(ruleId: string): Promise<void> {
  try {
    await db.collection(PRICING_RULES_COLLECTION).doc(ruleId).delete();
    console.log(`✅ Pricing rule deleted: ${ruleId}`);
  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    throw error;
  }
}

// ============================================================================
// CUSTODIAN OPERATIONS
// ============================================================================

/**
 * Create or update equipment custodian
 */
export async function upsertEquipmentCustodian(
  custodian: Omit<EquipmentCustodian, 'id' | 'createdAt' | 'updatedAt'>
): Promise<EquipmentCustodian> {
  try {
    // Check if custodian already exists
    const query = custodian.equipmentId
      ? db
          .collection(CUSTODIANS_COLLECTION)
          .where('equipmentId', '==', custodian.equipmentId)
          .where('zoneId', '==', custodian.zoneId)
      : db
          .collection(CUSTODIANS_COLLECTION)
          .where('equipmentId', '==', null)
          .where('zoneId', '==', custodian.zoneId);

    const existing = await query.limit(1).get();

    if (!existing.empty) {
      // Update existing
      const docId = existing.docs[0].id;
      await db.collection(CUSTODIANS_COLLECTION).doc(docId).update({
        ...custodian,
        updatedAt: new Date(),
      });
      return { id: docId, ...custodian, createdAt: existing.docs[0].data().createdAt, updatedAt: new Date() };
    } else {
      // Create new
      const newCustodian = {
        ...custodian,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const docRef = await db.collection(CUSTODIANS_COLLECTION).add(newCustodian);
      return { id: docRef.id, ...newCustodian };
    }
  } catch (error) {
    console.error('Error upserting equipment custodian:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS - Export for use in other files
// ============================================================================

export {
  getStorageCustodian,
  findBookingEndingBefore,
  findBookingStartingAfter,
  createHandoverDetails,
  calculatePricing,
};
