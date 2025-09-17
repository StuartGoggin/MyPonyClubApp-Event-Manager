/**
 * Mock Data for Testing
 * 
 * Centralized test data for consistent testing across all suites
 */

import { User, UserRole } from "../../lib/types";

/**
 * Mock users for testing
 */
export const mockUsers: User[] = [
  {
    id: "user-1",
    ponyClubId: "PC123456",
    firstName: "John",
    lastName: "Smith",
    email: "john@example.com",
    role: "standard" as UserRole,
    clubId: "club-1",
    zoneId: "zone-1",
    isActive: true,
    mobileNumber: "+61412345678",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "user-2",
    ponyClubId: "PC789012",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    role: "admin" as UserRole,
    clubId: "club-2",
    zoneId: "zone-1",
    isActive: true,
    mobileNumber: "+61498765432",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "user-3",
    ponyClubId: "PC345678",
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice@example.com",
    role: "standard" as UserRole,
    clubId: "club-3",
    zoneId: "zone-2",
    isActive: true,
    mobileNumber: "+61433221144",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
];

/**
 * Mock clubs for testing
 */
export const mockClubs = [
  {
    id: "club-1",
    name: "Sydney Pony Club",
    code: "SPC",
    zoneId: "zone-1",
    contactEmail: "contact@sydneypc.com",
    contactPhone: "+61299887766",
    address: "123 Club Street, Sydney NSW 2000",
    isActive: true,
  },
  {
    id: "club-2",
    name: "Melbourne Pony Club",
    code: "MPC",
    zoneId: "zone-1",
    contactEmail: "contact@melbournepc.com",
    contactPhone: "+61399887766",
    address: "456 Club Avenue, Melbourne VIC 3000",
    isActive: true,
  },
  {
    id: "club-3",
    name: "Brisbane Pony Club",
    code: "BPC",
    zoneId: "zone-2",
    contactEmail: "contact@brisbanepc.com",
    contactPhone: "+61733445566",
    address: "789 Club Road, Brisbane QLD 4000",
    isActive: true,
  },
];

/**
 * Mock zones for testing
 */
export const mockZones = [
  {
    id: "zone-1",
    name: "Eastern Zone",
    code: "EAST",
    description: "Eastern seaboard states",
    states: ["NSW", "VIC", "TAS"],
    contactEmail: "eastern@ponyclub.org.au",
  },
  {
    id: "zone-2",
    name: "Northern Zone",
    code: "NORTH",
    description: "Northern states and territories",
    states: ["QLD", "NT"],
    contactEmail: "northern@ponyclub.org.au",
  },
];

/**
 * Mock authentication credentials
 */
export const mockAuthCredentials = {
  valid: {
    ponyClubId: "PC123456",
    password: "correctPassword123",
  },
  invalid: {
    ponyClubId: "PC999999",
    password: "wrongPassword",
  },
  incomplete: {
    ponyClubId: "PC123456",
    // Missing password
  },
};

/**
 * Mock JWT payloads
 */
export const mockJwtPayloads = {
  standard: {
    userId: "user-1",
    ponyClubId: "PC123456",
    role: "standard",
    clubId: "club-1",
    zoneId: "zone-1",
  },
  admin: {
    userId: "user-2",
    ponyClubId: "PC789012",
    role: "admin",
    clubId: "club-2",
    zoneId: "zone-1",
  },
  superAdmin: {
    userId: "admin-1",
    ponyClubId: "PC000001",
    role: "super_admin",
    clubId: "admin-club",
    zoneId: "all",
  },
};

/**
 * Mock event request data
 */
export const mockEventRequest = {
  formData: {
    clubId: "club-1",
    clubName: "Sydney Pony Club",
    submittedBy: "John Smith",
    submittedByEmail: "john.smith@sydneypc.com",
    submittedByPhone: "0412345678",
    events: [
      {
        priority: 1,
        name: "Spring Rally",
        eventTypeId: "rally",
        eventTypeName: "Rally",
        date: new Date("2025-10-15"),
        location: "Sydney Equestrian Centre",
        isQualifier: true,
        isHistoricallyTraditional: false,
        description: "Annual spring rally competition",
        coordinatorName: "Jane Doe",
        coordinatorContact: "jane.doe@sydneypc.com",
        notes: "Weather dependent event",
      },
    ],
  },
};

/**
 * Mock email queue data
 */
export const mockEmailQueue = [
  {
    id: "email-1",
    to: "john@example.com",
    subject: "Test Email 1",
    body: "This is a test email",
    status: "pending",
    priority: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    attempts: 0,
  },
  {
    id: "email-2",
    to: "jane@example.com",
    subject: "Test Email 2",
    body: "This is another test email",
    status: "sent",
    priority: 2,
    createdAt: "2024-01-02T00:00:00.000Z",
    attempts: 1,
    sentAt: "2024-01-02T01:00:00.000Z",
  },
];

/**
 * Mock Firebase error responses
 */
export const mockFirebaseErrors = {
  notFound: {
    code: "not-found",
    message: "Document not found",
  },
  permission: {
    code: "permission-denied",
    message: "Insufficient permissions",
  },
  network: {
    code: "unavailable",
    message: "Network error",
  },
};

/**
 * Mock geolocation data
 */
export const mockGeolocation = {
  validAddress: {
    address: "123 Collins Street, Melbourne VIC 3000",
    coordinates: {
      latitude: -37.8136,
      longitude: 144.9631,
    },
  },
  invalidAddress: {
    address: "Invalid Address That Does Not Exist",
    coordinates: null,
  },
};

/**
 * Helper functions for generating dynamic mock data
 */
export const mockDataHelpers = {
  /**
   * Generate a random user
   */
  generateUser(overrides: Partial<User> = {}): User {
    const id = `user-${Date.now()}`;
    return {
      id,
      ponyClubId: `PC${Math.random().toString().substr(2, 6)}`,
      firstName: "Test",
      lastName: "User",
      email: `test${id}@example.com`,
      role: "standard" as UserRole,
      clubId: "club-1",
      zoneId: "zone-1",
      isActive: true,
      mobileNumber: "+61400000000",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  },

  /**
   * Generate multiple users
   */
  generateUsers(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.generateUser(overrides));
  },

  /**
   * Generate a random club
   */
  generateClub(overrides: any = {}): any {
    const id = `club-${Date.now()}`;
    return {
      id,
      name: `Test Club ${id}`,
      code: `TC${Math.random().toString().substr(2, 3)}`,
      zoneId: "zone-1",
      contactEmail: `contact@${id}.com`,
      contactPhone: "+61400000000",
      address: "123 Test Street, Test City",
      isActive: true,
      ...overrides,
    };
  },
};

/**
 * Export individual mock objects for convenience
 */
export const singleMockUser = mockUsers[0];
export const singleMockAdmin = mockUsers[1];
export const singleMockClub = mockClubs[0];
export const singleMockZone = mockZones[0];

/**
 * Additional mock data for comprehensive testing
 */
export const mockEvents = [
  {
    id: "event-1",
    name: "Summer Rally",
    date: "2025-12-15T10:00:00Z",
    location: "Sydney Pony Club Grounds",
    eventTypeId: "rally",
    coordinatorName: "Jane Smith",
    coordinatorContact: "jane@sydneypc.com",
    clubId: "club-1",
    isQualifier: true,
    priority: 1,
    isHistoricallyTraditional: true,
    maxParticipants: 50,
    registeredParticipants: 15,
    status: "active",
  },
  {
    id: "event-2",
    name: "Winter Show",
    date: "2025-06-20T09:00:00Z",
    location: "Melbourne Pony Club",
    eventTypeId: "show",
    coordinatorName: "Bob Wilson",
    coordinatorContact: "bob@melbournepc.com",
    clubId: "club-2",
    isQualifier: false,
    priority: 2,
    isHistoricallyTraditional: false,
    maxParticipants: 30,
    registeredParticipants: 8,
    status: "active",
  },
];

export const singleMockEvent = mockEvents[0];

export const mockEmailRequests = [
  {
    id: "email-req-1",
    submittedByName: "Test User",
    submittedByEmail: "test@example.com",
    submittedByContact: "0400-123-456",
    clubId: "club-1",
    status: "pending",
    submittedAt: "2025-01-01T10:00:00Z",
    events: [mockEvents[0]],
  },
];

export const singleMockEmailRequest = {
  submittedByName: "Test User",
  submittedByEmail: "test@example.com",
  submittedByContact: "0400-123-456",
  clubId: "club-1",
  events: [
    {
      name: "Test Event for Email",
      date: "2025-12-20",
      location: "Test Venue",
      eventTypeId: "rally",
      coordinatorName: "Test Coordinator",
      coordinatorContact: "coord@test.com",
      isQualifier: false,
      priority: 1,
      isHistoricallyTraditional: false,
    },
  ],
};

export const mockEventRegistration = {
  id: "reg-1",
  eventId: "event-1",
  participantName: "John Doe",
  participantEmail: "john@example.com",
  clubId: "club-1",
  division: "senior",
  status: "confirmed",
  registeredAt: "2025-01-01T10:00:00Z",
};

export const adminMockJwt = mockJwtPayloads.admin;