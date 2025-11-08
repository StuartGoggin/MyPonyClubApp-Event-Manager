import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Club } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a club's address information into a readable location string
 * @param club The club object containing address information
 * @returns Formatted address string or empty string if no address info available
 */
export function formatClubAddress(club: Club | null | undefined): string {
  if (!club?.address) return '';

  const { address1, address2, address3, town, county, postcode, country } = club.address;
  
  const addressParts = [
    address1,
    address2,
    address3,
    town,
    county,
    postcode,
    country
  ].filter(part => part && part.trim().length > 0);

  return addressParts.join(', ');
}
