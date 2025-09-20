import {User} from "./types";

/**
 * Basic user validation for Firebase Functions
 */

export function validateUser(userData: Partial<User>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields validation
  if (!userData.firstName || userData.firstName.trim().length === 0) {
    errors.push("First name is required");
  }

  if (!userData.lastName || userData.lastName.trim().length === 0) {
    errors.push("Last name is required");
  }

  if (!userData.email || userData.email.trim().length === 0) {
    errors.push("Email is required");
  } else if (!isValidEmail(userData.email)) {
    errors.push("Invalid email format");
  }

  if (!userData.ponyClubId || userData.ponyClubId.trim().length === 0) {
    errors.push("Pony Club ID is required");
  }

  if (!userData.clubId || userData.clubId.trim().length === 0) {
    errors.push("Club ID is required");
  }

  if (!userData.zoneId || userData.zoneId.trim().length === 0) {
    errors.push("Zone ID is required");
  }

  // Role validation
  if (
    userData.role &&
    !["standard", "zone_rep", "super_user"].includes(userData.role)
  ) {
    errors.push("Invalid role. Must be standard, zone_rep, or super_user");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateLoginCredentials(
  ponyClubId: string,
  mobileNumber: string,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!ponyClubId || ponyClubId.trim().length === 0) {
    errors.push("Pony Club ID is required");
  }

  if (!mobileNumber || mobileNumber.trim().length === 0) {
    errors.push("Mobile number is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
