import { adminDb } from './firebase-admin';
import { User, UserImportRow, UserImportResult, UserImportError, Club, Zone } from './types';
import { validateUserImportRows, ValidatedUserImportRow } from './user-validation';
import { mapImportData } from './import-mappings';
import { v4 as uuidv4 } from 'uuid';

const USERS_COLLECTION = 'users';
const CLUBS_COLLECTION = 'clubs';
const ZONES_COLLECTION = 'zones';

export class UserService {
  
  /**
   * Get user by Pony Club ID and mobile number (for login)
   */
  static async getUserByCredentials(ponyClubId: string, mobileNumber: string): Promise<User | null> {
    try {
      const snapshot = await adminDb
        .collection(USERS_COLLECTION)
        .where('ponyClubId', '==', ponyClubId.toUpperCase())
        .where('mobileNumber', '==', mobileNumber)
        .where('isActive', '==', true)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      const userData = doc.data();
      
      // Update last login timestamp
      await doc.ref.update({
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });
      
      return {
        id: doc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        importedAt: userData.importedAt?.toDate()
      } as User;
      
    } catch (error) {
      console.error('Error getting user by credentials:', error);
      throw new Error('Failed to authenticate user');
    }
  }
  
  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const doc = await adminDb.collection(USERS_COLLECTION).doc(userId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      const userData = doc.data();
      return {
        id: doc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate(),
        updatedAt: userData.updatedAt?.toDate(),
        lastLoginAt: userData.lastLoginAt?.toDate(),
        importedAt: userData.importedAt?.toDate()
      } as User;
      
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error('Failed to retrieve user');
    }
  }
  
  /**
   * Get all users with optional filtering
   */
  static async getUsers(options: {
    clubId?: string;
    zoneId?: string;
    role?: string;
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<User[]> {
    try {
      let query = adminDb.collection(USERS_COLLECTION);
      
      if (options.clubId) {
        query = query.where('clubId', '==', options.clubId);
      }
      
      if (options.zoneId) {
        query = query.where('zoneId', '==', options.zoneId);
      }
      
      if (options.role) {
        query = query.where('role', '==', options.role);
      }
      
      if (options.isActive !== undefined) {
        query = query.where('isActive', '==', options.isActive);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const snapshot = await query.get();
      
      return snapshot.docs.map((doc: any) => {
        const userData = doc.data();
        return {
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate(),
          updatedAt: userData.updatedAt?.toDate(),
          lastLoginAt: userData.lastLoginAt?.toDate(),
          importedAt: userData.importedAt?.toDate()
        } as User;
      });
      
    } catch (error) {
      console.error('Error getting users:', error);
      throw new Error('Failed to retrieve users');
    }
  }
  
  /**
   * Create a new user
   */
  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const now = new Date();
      const newUser = {
        ...userData,
        role: userData.role || 'standard' as const, // Ensure all users have a role
        createdAt: now,
        updatedAt: now,
        isActive: userData.isActive ?? true
      };
      
      const docRef = await adminDb.collection(USERS_COLLECTION).add(newUser);
      
      return {
        id: docRef.id,
        ...newUser
      };
      
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }
  
  /**
   * Update user
   */
  static async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await adminDb.collection(USERS_COLLECTION).doc(userId).update(updateData);
      
      const updatedUser = await this.getUserById(userId);
      if (!updatedUser) {
        throw new Error('User not found after update');
      }
      
      return updatedUser;
      
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }
  
  /**
   * Delete user (soft delete by setting isActive to false)
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      await adminDb.collection(USERS_COLLECTION).doc(userId).update({
        isActive: false,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }
  
  /**
   * Check if Pony Club ID already exists and return the user if found
   */
  static async getUserByPonyClubId(ponyClubId: string): Promise<User | null> {
    try {
      const snapshot = await adminDb
        .collection(USERS_COLLECTION)
        .where('ponyClubId', '==', ponyClubId.toUpperCase())
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      const userData = doc.data();
      return {
        id: doc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate(),
        updatedAt: userData.updatedAt?.toDate(),
        lastLoginAt: userData.lastLoginAt?.toDate(),
        importedAt: userData.importedAt?.toDate()
      } as User;
      
    } catch (error) {
      console.error('Error getting user by Pony Club ID:', error);
      throw new Error('Failed to get user by Pony Club ID');
    }
  }

  /**
   * Check if Pony Club ID already exists
   */
  static async ponyClubIdExists(ponyClubId: string, excludeUserId?: string): Promise<boolean> {
    try {
      let query = adminDb
        .collection(USERS_COLLECTION)
        .where('ponyClubId', '==', ponyClubId.toUpperCase())
        .where('isActive', '==', true);
      
      const snapshot = await query.get();
      
      if (excludeUserId) {
        return snapshot.docs.some((doc: any) => doc.id !== excludeUserId);
      }
      
      return !snapshot.empty;
      
    } catch (error) {
      console.error('Error checking Pony Club ID:', error);
      throw new Error('Failed to check Pony Club ID');
    }
  }
  
  /**
   * Get club by name with fuzzy matching (for import resolution)
   */
  static async getClubByName(clubName: string): Promise<Club | null> {
    try {
      const normalizedSearchName = clubName.trim().toLowerCase();
      
      // First try exact match
      let snapshot = await adminDb
        .collection(CLUBS_COLLECTION)
        .where('name', '==', clubName.trim())
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Club;
      }
      
      // Try case-insensitive match by getting all clubs and filtering
      const allClubsSnapshot = await adminDb.collection(CLUBS_COLLECTION).get();
      
      for (const doc of allClubsSnapshot.docs) {
        const clubData = doc.data();
        const clubNameLower = clubData.name.toLowerCase();
        
        // Exact case-insensitive match
        if (clubNameLower === normalizedSearchName) {
          return { id: doc.id, ...clubData } as Club;
        }
        
        // Fuzzy match - check if one contains the other (handles variations)
        if (clubNameLower.includes(normalizedSearchName) || normalizedSearchName.includes(clubNameLower)) {
          return { id: doc.id, ...clubData } as Club;
        }
      }
      
      return null;
      
    } catch (error) {
      console.error('Error getting club by name:', error);
      return null;
    }
  }

  /**
   * Get zone by name with fuzzy matching (for import resolution)
   */
  static async getZoneByName(zoneName: string): Promise<Zone | null> {
    try {
      const normalizedSearchName = zoneName.trim().toLowerCase();
      
      // First try exact match
      let snapshot = await adminDb
        .collection(ZONES_COLLECTION)
        .where('name', '==', zoneName.trim())
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Zone;
      }
      
      // Try case-insensitive match by getting all zones and filtering
      const allZonesSnapshot = await adminDb.collection(ZONES_COLLECTION).get();
      
      for (const doc of allZonesSnapshot.docs) {
        const zoneData = doc.data();
        const zoneNameLower = zoneData.name.toLowerCase();
        
        // Exact case-insensitive match
        if (zoneNameLower === normalizedSearchName) {
          return { id: doc.id, ...zoneData } as Zone;
        }
        
        // Fuzzy match - check if one contains the other (handles variations like "victoria" vs "Victoria")
        if (zoneNameLower.includes(normalizedSearchName) || normalizedSearchName.includes(zoneNameLower)) {
          return { id: doc.id, ...zoneData } as Zone;
        }
      }
      
      return null;
      
    } catch (error) {
      console.error('Error getting zone by name:', error);
      return null;
    }
  }  /**
   * Import users from spreadsheet data - supports re-runnable imports
   */
  static async importUsers(rawRows: unknown[]): Promise<UserImportResult> {
    const importBatch = uuidv4();
    const importedAt = new Date();
    const errors: UserImportError[] = [];
    let successfulImports = 0;
    let updatedUsers = 0;
    let createdUsers = 0;
    
    try {
      // Validate all rows first
      const { validRows, errors: validationErrors } = validateUserImportRows(rawRows);
      
      // Add validation errors to the error list
      errors.push(...validationErrors.map(e => ({
        row: e.row,
        data: e.data as UserImportRow,
        error: e.error
      })));
      
      // Process valid rows
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        const rowNumber = rawRows.findIndex(r => r === rawRows[validationErrors.length + i]) + 1;
        
        try {
          const result = await this.processUserImport(row, importBatch, importedAt);
          successfulImports++;
          
          if (result.updated) {
            updatedUsers++;
          } else {
            createdUsers++;
          }
        } catch (error) {
          errors.push({
            row: rowNumber,
            data: {
              ponyClubId: row.ponyClubId,
              mobileNumber: row.mobileNumber || '',
              clubName: row.clubName || '',
              firstName: row.firstName || '',
              lastName: row.lastName || '',
              email: row.email || ''
            } as UserImportRow,
            error: error instanceof Error ? error.message : 'Unknown error during import'
          });
        }
      }
      
      return {
        success: errors.length === 0,
        totalRows: rawRows.length,
        successfulImports,
        failedImports: errors.length,
        updatedUsers,
        createdUsers,
        errors,
        importBatch,
        importedAt
      };
      
    } catch (error) {
      console.error('Error during user import:', error);
      throw new Error('Failed to import users');
    }
  }

  /**
   * Process a single user import - creates new user or updates existing
   */
  private static async processUserImport(
    row: ValidatedUserImportRow, 
    importBatch: string, 
    importedAt: Date
  ): Promise<{ updated: boolean }> {
    // Check if user already exists
    const existingUser = await this.getUserByPonyClubId(row.ponyClubId);
    
    // Use mapping system to get proper club and zone IDs
    const mappingResult = await mapImportData({
      clubName: row.clubName,
      zoneName: row.zoneName
    });
    
    console.log(`[UserService] Import mapping for ${row.ponyClubId}:`, {
      inputClub: row.clubName,
      inputZone: row.zoneName,
      mappedClub: mappingResult.clubName,
      mappedZone: mappingResult.zoneName,
      clubId: mappingResult.clubId,
      zoneId: mappingResult.zoneId
    });
    
    const userData: any = {
      ponyClubId: row.ponyClubId,
      isActive: true,
      importedAt,
      importBatch,
      zoneId: mappingResult.zoneId // Always set a zone ID
    };
    
    // Add role if provided in the import data
    if (row.role !== undefined) {
      userData.role = row.role;
    }
    
    // Add mobile number if provided (now optional)
    if (row.mobileNumber) {
      userData.mobileNumber = row.mobileNumber;
    }
    
    // Add club ID if mapping found a club
    if (mappingResult.clubId) {
      userData.clubId = mappingResult.clubId;
    }
    
    // Add optional fields if provided
    if (row.firstName) userData.firstName = row.firstName;
    if (row.lastName) userData.lastName = row.lastName;
    if (row.email) userData.email = row.email;
    
    if (existingUser) {
      // Update existing user
      await this.updateUser(existingUser.id, {
        ...userData,
        updatedAt: new Date()
      });
      return { updated: true };
    } else {
      // Create new user
      await this.createUser(userData);
      return { updated: false };
    }
  }
}
