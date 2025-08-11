"use server";

import { seedData } from "./data"; // Assuming seedData is in a file named data.ts in the same directory. Adjust the path if necessary.

async function callSeedData() {
    return await seedData();
}