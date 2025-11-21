import { adminDb } from './firebase-admin';
import { CommitteeNomination, CommitteeNominationFormData } from '@/types/committee-nomination';

const COLLECTION = 'committee_nominations';

/**
 * Create a new committee nomination
 */
export async function createCommitteeNomination(
  formData: CommitteeNominationFormData
): Promise<string> {
  const nomination: Omit<CommitteeNomination, 'id'> = {
    clubId: formData.clubId,
    clubName: formData.clubName,
    zoneId: formData.zoneId,
    zoneName: formData.zoneName,
    year: formData.year,
    agmDate: formData.agmDate,
    effectiveDate: formData.effectiveDate,
    submittedAt: new Date().toISOString(),
    submittedBy: {
      name: formData.submitterName,
      email: formData.submitterEmail,
      phone: formData.submitterPhone,
    },
    
    districtCommissioner: {
      ...formData.districtCommissioner,
      approvalStatus: 'pending',
    },
    
    president: formData.president,
    vicePresident: formData.vicePresident,
    secretary: formData.secretary,
    treasurer: formData.treasurer,
    
    zoneRepresentative: buildZoneRepresentative(formData),
    
    additionalNotes: formData.additionalNotes,
    
    status: 'pending_dc_approval',
  };

  const docRef = await adminDb.collection(COLLECTION).add(nomination);
  return docRef.id;
}

/**
 * Build zone representative object from form data
 */
function buildZoneRepresentative(formData: CommitteeNominationFormData): {
  isCommitteeMember: boolean;
  name: string;
  ponyClubId: string;
  mobile: string;
  email: string;
  position?: string;
} | undefined {
  // If zone rep other is provided (new simplified form)
  if (formData.zoneRepOption === 'other' && formData.zoneRepOther && formData.zoneRepOther.name) {
    return {
      isCommitteeMember: false,
      name: formData.zoneRepOther.name,
      ponyClubId: formData.zoneRepOther.ponyClubId,
      mobile: formData.zoneRepOther.mobile,
      email: formData.zoneRepOther.email,
    };
  }
  
  // Find the committee member marked as zone rep (legacy support)
  const position = formData.zoneRepCommitteePosition || '';
  let member;
  
  switch (position) {
    case 'districtCommissioner':
      member = formData.districtCommissioner;
      break;
    case 'president':
      member = formData.president;
      break;
    case 'vicePresident':
      member = formData.vicePresident;
      break;
    case 'secretary':
      member = formData.secretary;
      break;
    case 'treasurer':
      member = formData.treasurer;
      break;
  }
  
  if (member && member.name) {
    return {
      isCommitteeMember: true,
      position,
      name: member.name,
      ponyClubId: member.ponyClubId,
      mobile: member.mobile,
      email: member.email,
    };
  }
  
  // Zone representative is now optional - return undefined if not provided
  return undefined;
}

/**
 * Get committee nomination by ID
 */
export async function getCommitteeNomination(id: string): Promise<CommitteeNomination | null> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return {
    id: doc.id,
    ...doc.data(),
  } as CommitteeNomination;
}

/**
 * Get all committee nominations for a club
 */
export async function getClubCommitteeNominations(clubId: string): Promise<CommitteeNomination[]> {
  const snapshot = await adminDb.collection(COLLECTION)
    .where('clubId', '==', clubId)
    .orderBy('submittedAt', 'desc')
    .get();
  
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  } as CommitteeNomination));
}

/**
 * Get pending DC approvals for a zone representative
 */
export async function getPendingDCApprovals(zoneRepId: string): Promise<CommitteeNomination[]> {
  try {
    console.log('getPendingDCApprovals called with zoneRepId:', zoneRepId);
    
    // First, get the zone representative's zone ID from the users collection
    const userDoc = await adminDb.collection('users').doc(zoneRepId).get();
    
    if (!userDoc.exists) {
      console.error('Zone representative not found:', zoneRepId);
      return [];
    }
    
    const userData = userDoc.data();
    const zoneId = userData?.zoneId;
    
    console.log('Zone representative data:', { zoneId, email: userData?.email });
    
    if (!zoneId) {
      console.error('Zone representative has no zone assigned:', zoneRepId);
      return [];
    }
    
    // Query nominations for this zone with pending approval
    console.log('Querying nominations for zoneId:', zoneId);
    const snapshot = await adminDb.collection(COLLECTION)
      .where('zoneId', '==', zoneId)
      .where('districtCommissioner.approvalStatus', '==', 'pending')
      .orderBy('submittedAt', 'asc')
      .get();
    
    console.log(`Found ${snapshot.docs.length} pending nominations for zone ${zoneId}`);
    
    // Log each nomination's details for debugging
    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      console.log('Nomination in DB:', {
        id: doc.id,
        clubName: data.clubName,
        zoneId: data.zoneId,
        dcApprovalStatus: data.districtCommissioner?.approvalStatus,
        status: data.status,
      });
    });
    
    const nominations = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    } as CommitteeNomination));
    
    console.log('Nominations:', nominations.map((n: CommitteeNomination) => ({ id: n.id, clubName: n.clubName, zoneId: n.zoneId })));
    
    return nominations;
  } catch (error) {
    console.error('Error in getPendingDCApprovals:', error);
    // If it's an index error, log the index creation URL
    if (error instanceof Error && error.message.includes('index')) {
      console.error('FIRESTORE INDEX REQUIRED - Check the error message for the index creation URL');
    }
    throw error;
  }
}

/**
 * Approve district commissioner nomination
 */
export async function approveDC(
  nominationId: string,
  approvedBy: string,
  message?: string
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(nominationId).update({
    'districtCommissioner.approvalStatus': 'approved',
    'districtCommissioner.approvedBy': approvedBy,
    'districtCommissioner.approvedAt': new Date().toISOString(),
    'status': 'approved',
  });
}

/**
 * Reject district commissioner nomination
 */
export async function rejectDC(
  nominationId: string,
  rejectedBy: string,
  reason: string
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(nominationId).update({
    'districtCommissioner.approvalStatus': 'rejected',
    'districtCommissioner.approvedBy': rejectedBy,
    'districtCommissioner.approvedAt': new Date().toISOString(),
    'districtCommissioner.rejectionReason': reason,
    'status': 'rejected',
  });
}

/**
 * Get latest approved committee for a club
 */
export async function getLatestApprovedCommittee(clubId: string): Promise<CommitteeNomination | null> {
  const snapshot = await adminDb.collection(COLLECTION)
    .where('clubId', '==', clubId)
    .where('status', '==', 'approved')
    .orderBy('year', 'desc')
    .orderBy('effectiveDate', 'desc')
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as CommitteeNomination;
}

/**
 * Get committee nomination for a specific club and year
 */
export async function getCommitteeNominationByYear(
  clubId: string,
  year: number
): Promise<CommitteeNomination | null> {
  const snapshot = await adminDb.collection(COLLECTION)
    .where('clubId', '==', clubId)
    .where('year', '==', year)
    .orderBy('submittedAt', 'desc')
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as CommitteeNomination;
}

/**
 * Get all years that have committee nominations for a club
 */
export async function getClubCommitteeYears(clubId: string): Promise<number[]> {
  const snapshot = await adminDb.collection(COLLECTION)
    .where('clubId', '==', clubId)
    .orderBy('year', 'desc')
    .get();
  
  const years = new Set<number>();
  snapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    if (data.year) {
      years.add(data.year);
    }
  });
  
  return Array.from(years).sort((a, b) => b - a);
}
