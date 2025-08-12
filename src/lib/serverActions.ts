
"use server";

import { seedData } from "./data";

export async function callSeedData() {
    return await seedData();
}


    