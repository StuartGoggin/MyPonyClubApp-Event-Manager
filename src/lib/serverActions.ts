
"use server";

import { seedData } from "./data";

export async function callSeedData() {
    try {
        await seedData();
        return { success: true, message: 'Data seeded successfully!' };
    } catch (error) {
        console.error('Error seeding data:', error);
        return { success: false, message: 'Failed to seed data. Check console for details.' };
    }
}


    