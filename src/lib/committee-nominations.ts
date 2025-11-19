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
    
    additionalCommittee: formData.additionalCommittee,
    
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
    default:
      // Check additional committee
      const additionalMember = formData.additionalCommittee.find(m => m.isZoneRep);
      if (additionalMember) {
        member = additionalMember;
      }
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
 * Get pending DC approvals for a zone
 */
export async function getPendingDCApprovals(zoneId: string): Promise<CommitteeNomination[]> {
  const snapshot = await adminDb.collection(COLLECTION)
    .where('zoneId', '==', zoneId)
    .where('districtCommissioner.approvalStatus', '==', 'pending')
    .orderBy('submittedAt', 'asc')
    .get();
  
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  } as CommitteeNomination));
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
