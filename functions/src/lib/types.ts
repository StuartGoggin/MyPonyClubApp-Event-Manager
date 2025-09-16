// Core types for Firebase Functions
export interface Approver {
  name: string;
  email: string;
  mobile: string;
}

export interface Zone {
  id: string;
  name: string;
  streetAddress?: string;
  imageUrl?: string;
  secretary?: Approver;
  eventApprovers?: Approver[];
  scheduleApprovers?: Approver[];
}

export interface Club {
  id: string;
  name: string;
  zoneId: string;
  clubId?: number;
  
  // Address information
  physicalAddress?: string;
  postalAddress?: string;
  latitude?: number;
  longitude?: number;
  
  // Contact information
  email?: string;
  phone?: string;
  website?: string;
  websiteUrl?: string;
  
  // Social media
  socialMediaUrl?: string;
  
  // Images
  logoUrl?: string;
  imageUrl?: string;
  images?: string[];
  
  // Contact details
  contactDetails?: {
    primaryContact?: {
      name: string;
      role: string;
      email: string;
      phone?: string;
      mobile?: string;
    };
    secretary?: {
      name: string;
      email: string;
      phone?: string;
      mobile?: string;
    };
    chiefInstructor?: {
      name: string;
      email: string;
      mobile?: string;
      qualifications?: string[];
    };
  };
  
  // Status fields
  isActive?: boolean;
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  clubId: string;
  zoneId: string;
  location?: string;
  status?: 'draft' | 'submitted' | 'approved' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Import types
export interface ClubJsonData {
  id?: string;
  name: string;
  zoneId: string;
  physicalAddress?: string;
  email?: string;
  phone?: string;
  website?: string;
  [key: string]: any;
}
