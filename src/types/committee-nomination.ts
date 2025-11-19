// Committee Nomination Types

export interface CommitteeMember {
  name: string;
  ponyClubId: string;
  mobile: string;
  email: string;
  isZoneRep: boolean;
}

export interface DistrictCommissioner extends CommitteeMember {
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface AdditionalCommitteeMember extends CommitteeMember {
  position: string;
}

export interface ZoneRepresentative {
  isCommitteeMember: boolean;
  position?: string; // e.g., 'president', 'secretary', null if not committee member
  name: string;
  ponyClubId: string;
  mobile: string;
  email: string;
}

export interface CommitteeNomination {
  id: string;
  clubId: string;
  clubName: string;
  zoneId: string;
  zoneName: string;
  agmDate: string;
  effectiveDate: string;
  submittedAt: string;
  submittedBy: {
    name: string;
    email: string;
    phone: string;
  };
  
  districtCommissioner: DistrictCommissioner;
  president?: CommitteeMember;
  vicePresident?: CommitteeMember;
  secretary?: CommitteeMember;
  treasurer?: CommitteeMember;
  
  additionalCommittee: AdditionalCommitteeMember[];
  
  zoneRepresentative?: ZoneRepresentative;
  
  additionalNotes?: string;
  
  status: 'pending_dc_approval' | 'approved' | 'rejected' | 'withdrawn';
}

export interface CommitteeNominationFormData {
  clubId: string;
  clubName: string;
  zoneId: string;
  zoneName: string;
  agmDate: string;
  effectiveDate: string;
  
  districtCommissioner: Omit<DistrictCommissioner, 'approvalStatus' | 'approvedBy' | 'approvedAt' | 'rejectionReason'>;
  president?: CommitteeMember;
  vicePresident?: CommitteeMember;
  secretary?: CommitteeMember;
  treasurer?: CommitteeMember;
  
  additionalCommittee: AdditionalCommitteeMember[];
  
  zoneRepOption: 'committee' | 'other';
  zoneRepCommitteePosition?: string;
  zoneRepOther?: CommitteeMember;
  
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  additionalNotes?: string;
}

export interface UserAutocompleteResult {
  id: string;
  name: string;
  ponyClubId: string;
  mobile?: string;
  email?: string;
  clubId?: string;
  clubName?: string;
}
