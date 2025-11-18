import { z } from 'zod';
import { UserRole } from './types';

// Only log in development mode
const isDev = process.env.NODE_ENV === 'development';

// Australian mobile number validation (supports various formats)
const australianMobileRegex = /^(\+?61|0)?[4-5]\d{8}$/;

// Pony Club ID validation - can be either PC format or numeric MID
const ponyClubIdRegex = /^([A-Z]{2,3}\d{4,8}|\d{4,8})$/i;

export const UserRoleSchema = z.enum(['standard', 'zone_rep', 'super_user']);

export const UserImportRowSchema = z.object({
  ponyClubId: z.string()
    .min(4, 'Pony Club ID must be at least 4 characters')
    .max(12, 'Pony Club ID must be no more than 12 characters')
    .regex(ponyClubIdRegex, 'Invalid Pony Club ID format (e.g., PC123456 or 1234567)')
    .transform(s => s.toUpperCase().trim()),
  
  mobileNumber: z.string()
    .optional()
    .transform(s => {
      // Skip validation if empty or missing
      if (!s || s.trim() === '' || s.trim() === 'null' || s.trim() === '0' || s.trim() === '0000000000') {
        if (isDev) console.log(`[UserValidation] Empty or invalid mobile number, skipping`);
        return undefined;
      }
      
      // Clean and normalize mobile number to Australian domestic format (0...)
      let normalized = s.replace(/[\s\-\(\)]/g, ''); // Remove spaces, dashes, parentheses
      
      // Check if it's a valid Australian mobile number
      if (!australianMobileRegex.test(normalized)) {
        if (isDev) console.log(`[UserValidation] Invalid mobile number format: "${s}", skipping`);
        return undefined;
      }
      
      // Convert international format to domestic
      if (normalized.startsWith('+61')) {
        normalized = '0' + normalized.slice(3);
      } else if (normalized.startsWith('61') && normalized.length === 11) {
        normalized = '0' + normalized.slice(2);
      } else if (!normalized.startsWith('0') && normalized.length === 9) {
        normalized = '0' + normalized;
      }
      
      return normalized;
    }),
  
  clubName: z.string()
    .optional()
    .transform(s => {
      // Skip validation if empty or missing
      if (!s || s.trim() === '' || s.trim() === 'null') {
        if (isDev) console.log(`[UserValidation] Empty club name, skipping`);
        return undefined;
      }
      
      // Handle multiple clubs separated by commas - take the first one
      let clubName = s.trim();
      if (clubName.includes(',')) {
        clubName = clubName.split(',')[0].trim();
        if (isDev) console.log(`[UserValidation] Multiple clubs found, using first: "${clubName}"`);
      }
      
      // If still empty after processing, return undefined
      if (!clubName || clubName.length < 2) {
        if (isDev) console.log(`[UserValidation] Club name too short after processing: "${clubName}", skipping`);
        return undefined;
      }

      // Clean HTML entities
      clubName = clubName.replace(/&amp;/g, '&');
      
      // Return normalized club name (mapping will be done in service layer)
      return clubName
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }),
  
  zoneName: z.string()
    .optional()
    .transform(s => {
      // Skip validation if empty or missing
      if (!s || s.trim() === '' || s.trim() === 'null') {
        if (isDev) console.log(`[UserValidation] Empty zone name, using default`);
        return 'VIC/Southern Metropolitan'; // Use a standardized default
      }
      
      // Handle multiple zones separated by commas - take the first one
      let zoneName = s.trim();
      if (zoneName.includes(',')) {
        zoneName = zoneName.split(',')[0].trim();
        if (isDev) console.log(`[UserValidation] Multiple zones found, using first: "${zoneName}"`);
      }
      
      // Return the normalized zone name (mapping will be done in service layer)
      return zoneName;
    }),
  
  role: z.string()
    .optional()
    .transform(s => {
      if (isDev) console.log(`[UserValidation] Role transform received: "${s}" (type: ${typeof s})`);
      
      // If role column is missing or empty, return undefined (no role data)
      if (!s || s.trim() === '' || s.trim() === 'null' || s.trim() === 'undefined') {
        if (isDev) console.log(`[UserValidation] Role is empty/null/undefined, returning undefined`);
        return undefined;
      }
      
      // Normalize role names from spreadsheet
      const normalized = s.toLowerCase().trim();
      if (isDev) console.log(`[UserValidation] Normalized role: "${normalized}"`);
      
      // Check if this is membership status data rather than role data
      if (normalized === 'historical membership' || normalized === 'historical' || 
          normalized.includes('historical') || normalized === 'inactive membership') {
        // Return undefined so this doesn't override existing roles, 
        // and let membershipStatus field handle the membership logic
        if (isDev) console.log(`[UserValidation] Detected membership status "${s}", not treating as role`);
        return undefined;
      }
      
      // Check if this looks like membership data rather than role data
      if (normalized.includes('riding member') || normalized.includes('non-riding') || 
          normalized.includes('senior') || normalized.includes('junior') ||
          normalized.includes('adult') || normalized.includes('child')) {
        if (isDev) console.log(`[UserValidation] Detected membership data "${s}" in role field, not treating as role`);
        return undefined;
      }
      
      switch (normalized) {
        case 'standard':
        case 'standard user':
        case 'member':
        case 'user':
        case 'membership':
        case 'active membership':
          if (isDev) console.log(`[UserValidation] Mapping role "${s}" to standard`);
          return 'standard';
        case 'zone rep':
        case 'zone representative':
        case 'zone_rep':
        case 'zonerep':
          if (isDev) console.log(`[UserValidation] Mapping role "${s}" to zone_rep`);
          return 'zone_rep';
        case 'super user':
        case 'super_user':
        case 'admin':
        case 'administrator':
        case 'superuser':
          if (isDev) console.log(`[UserValidation] Mapping role "${s}" to super_user`);
          return 'super_user';
        default:
          // THIS IS THE PROBLEMATIC FALLBACK - don't default to standard!
          if (isDev) console.log(`[UserValidation] Unknown role "${s}", returning undefined instead of defaulting to standard`);
          return undefined;
      }
    }),
  
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be no more than 50 characters')
    .transform(s => {
      // Normalize first name - proper case
      return s.trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    })
    .optional(),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be no more than 50 characters')
    .transform(s => {
      // Normalize last name - proper case
      return s.trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    })
    .optional(),
  
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be no more than 100 characters')
    .trim()
    .toLowerCase()
    .optional()
    .or(z.literal(''))
    .transform(s => s === '' ? undefined : s),

  membershipStatus: z.string()
    .optional()
    .transform(s => {
      // If membership status column is missing or empty, return undefined
      if (!s || s.trim() === '' || s.trim() === 'null' || s.trim() === 'undefined') {
        return undefined;
      }
      
      // Normalize membership status
      const normalized = s.toLowerCase().trim();
      
      // Return normalized status for processing
      return normalized;
    })
});

export const UserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  
  ponyClubId: z.string()
    .min(6, 'Pony Club ID must be at least 6 characters')
    .max(12, 'Pony Club ID must be no more than 12 characters')
    .regex(ponyClubIdRegex, 'Invalid Pony Club ID format'),
  
  mobileNumber: z.string()
    .regex(australianMobileRegex, 'Invalid Australian mobile number format'),
  
  role: UserRoleSchema,
  
  clubId: z.string().min(1, 'Club ID is required'),
  zoneId: z.string().min(1, 'Zone ID is required'),
  
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  email: z.string().email().max(100).optional(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date().optional(),
  isActive: z.boolean().default(true),
  
  importedAt: z.date().optional(),
  importBatch: z.string().optional()
});

export const LoginCredentialsSchema = z.object({
  ponyClubId: z.string()
    .min(6, 'Pony Club ID must be at least 6 characters')
    .transform(s => s.toUpperCase()),
  
  mobileNumber: z.string()
    .regex(australianMobileRegex, 'Invalid mobile number format')
});

// Type inference from schemas
export type ValidatedUserImportRow = z.infer<typeof UserImportRowSchema>;
export type ValidatedUser = z.infer<typeof UserSchema>;
export type ValidatedLoginCredentials = z.infer<typeof LoginCredentialsSchema>;

// Validation helper functions
export function validateUserImportRow(data: unknown): ValidatedUserImportRow {
  return UserImportRowSchema.parse(data);
}

export function validateUser(data: unknown): ValidatedUser {
  return UserSchema.parse(data);
}

export function validateLoginCredentials(data: unknown): ValidatedLoginCredentials {
  return LoginCredentialsSchema.parse(data);
}

// Helper function to validate multiple rows with detailed error reporting
export function validateUserImportRows(rows: unknown[]): {
  validRows: ValidatedUserImportRow[];
  errors: Array<{ row: number; error: string; data: unknown }>;
} {
  const validRows: ValidatedUserImportRow[] = [];
  const errors: Array<{ row: number; error: string; data: unknown }> = [];
  
  rows.forEach((row, index) => {
    try {
      const validatedRow = validateUserImportRow(row);
      validRows.push(validatedRow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join('; ');
        errors.push({
          row: index + 1,
          error: errorMessage,
          data: row
        });
      } else {
        errors.push({
          row: index + 1,
          error: 'Unknown validation error',
          data: row
        });
      }
    }
  });
  
  return { validRows, errors };
}
