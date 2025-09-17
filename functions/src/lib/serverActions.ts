import { adminDb } from "./firebase-admin";
import type { Zone, Club, EventType } from "./types";

// Basic seed data for development
const basicZonesSeedData: Zone[] = [
  {
    id: "zone-central",
    name: "Central Zone",
    secretary: {
      name: "Admin User",
      email: "admin@centralzone.com",
      mobile: "0400 000 000",
    },
    eventApprovers: [
      {
        name: "Admin Approver",
        email: "approver@centralzone.com",
        mobile: "0400 000 001",
      },
    ],
    scheduleApprovers: [
      {
        name: "Admin Schedule",
        email: "schedule@centralzone.com",
        mobile: "0400 000 002",
      },
    ],
    imageUrl: "https://example.com/images/central-zone.png",
  },
];

const basicClubsSeedData: Club[] = [
  {
    id: "club-demo",
    name: "Demo Pony Club",
    zoneId: "zone-central",
    zoneName: "Central Zone",
    physicalAddress: "Demo Location",
    website: "https://demoponyclub.com",
    email: "contact@demoponyclub.com",
    phone: "03 9000 0000",
    isActive: true,
  },
];

const basicEventTypesSeedData: EventType[] = [
  {
    id: "event-type-rally",
    name: "Rally",
    description: "Regular club rally",
    color: "#4CAF50",
    requiresApproval: false,
    defaultDuration: 4,
  },
  {
    id: "event-type-competition",
    name: "Competition",
    description: "Club competition event",
    color: "#FF9800",
    requiresApproval: true,
    defaultDuration: 6,
  },
];

export async function callSeedData(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log("🌱 Starting basic database seeding...");

    // Seed zones
    console.log("📍 Seeding zones...");
    for (const zone of basicZonesSeedData) {
      await adminDb.collection("zones").doc(zone.id).set(zone);
    }

    // Seed clubs
    console.log("🏇 Seeding clubs...");
    for (const club of basicClubsSeedData) {
      await adminDb.collection("clubs").doc(club.id).set(club);
    }

    // Seed event types
    console.log("📅 Seeding event types...");
    for (const eventType of basicEventTypesSeedData) {
      await adminDb.collection("eventTypes").doc(eventType.id).set(eventType);
    }

    console.log("✅ Basic database seeding completed successfully");

    return {
      success: true,
      message: `Successfully seeded database with ${basicZonesSeedData.length} zones, ${basicClubsSeedData.length} clubs, and ${basicEventTypesSeedData.length} event types`,
    };
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    return {
      success: false,
      message: `Failed to seed database: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
