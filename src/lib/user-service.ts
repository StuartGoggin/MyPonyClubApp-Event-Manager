import { adminDb } from './firebase-admin';
import { 
  User, 
  UserImportRow, 
  UserImportResult, 
  UserImportError, 
  Club, 
  Zone,
  ImportChangesSummary,
  UserDataChanges
} from './types';
import { validateUserImportRows, ValidatedUserImportRow } from './user-validation';
import { mapImportData } from './import-mappings';
import { v4 as uuidv4 } from 'uuid';

/**
 * Progress tracking interface for real-time import updates
 */
export interface ImportProgress {
  phase: 'mapping' | 'processing' | 'completed' | 'error';
  currentAction: string;
  processedRows: number;
  totalRows: number;
  percentage: number;
  stats: {
    createdUsers: number;
    updatedUsers: number;
    deactivatedUsers: number;
    errorRows: number;
  };
}

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
   * Deactivate user account due to historical membership
   */
  static async deactivateUserForHistoricalMembership(userId: string, ponyClubId: string, importBatch: string): Promise<void> {
    try {
      await adminDb.collection(USERS_COLLECTION).doc(userId).update({
        isActive: false,
        membershipStatus: 'historical',
        deactivatedAt: new Date(),
        deactivatedBy: 'import',
        deactivationReason: 'Historical membership detected in import',
        lastImportBatch: importBatch,
        updatedAt: new Date()
      });
      console.log(`[UserService] Deactivated user ${ponyClubId} due to historical membership`);
    } catch (error) {
      console.error('Error deactivating user for historical membership:', error);
      throw new Error('Failed to deactivate user for historical membership');
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
          // Check for historical membership - handle these specially
          if (row.membershipStatus && row.membershipStatus.toLowerCase().includes('historical')) {
            // Find existing user to deactivate
            const existingUser = await this.getUserByPonyClubId(row.ponyClubId);
            if (existingUser) {
              await this.deactivateUserForHistoricalMembership(existingUser.id, row.ponyClubId, importBatch);
              updatedUsers++; // Count as update since we're changing existing user
              successfulImports++;
              console.log(`[UserService] Deactivated user ${row.ponyClubId} due to historical membership`);
            } else {
              console.log(`[UserService] User ${row.ponyClubId} has historical membership but no existing account found - skipping`);
            }
          } else {
            // Normal processing for active memberships
            const result = await this.processUserImport(row, importBatch, importedAt);
            successfulImports++;
            
            if (result.updated) {
              updatedUsers++;
            } else {
              createdUsers++;
            }
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
    
    // Handle role assignment - only update role if explicitly provided in spreadsheet
    if (row.role !== undefined) {
      // Role column exists and has a value, so update the role
      userData.role = row.role;
      console.log(`[UserService] Setting role for ${row.ponyClubId}: ${row.role}`);
    } else if (existingUser) {
      // No role column or empty role - preserve existing user's role
      userData.role = existingUser.role;
      console.log(`[UserService] No role column found, preserving existing role for ${row.ponyClubId}: ${existingUser.role}`);
    }
    // For new users with no role column, don't set a role (will use system default)
    
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

  /**
   * Send credentials email to user
   */
  static async sendCredentialsEmail(user: User): Promise<void> {
    try {
      // In a production environment, this would use a real email service
      // like SendGrid, AWS SES, or similar
      
      const emailContent = {
        to: user.email,
        subject: 'Your Pony Club Event Manager Login Credentials',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Your Pony Club Event Manager Login Credentials</h2>
            
            <p>Hello ${user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Pony Club Member'},</p>
            
            <p>Here are your login credentials for the Pony Club Event Manager system:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Username:</strong> ${user.ponyClubId}</p>
              <p><strong>Password:</strong> ${user.mobileNumber}</p>
            </div>
            
            <p>You can use these credentials to log in to the Pony Club Event Manager at:</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}" style="color: #2563eb;">${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}</a></p>
            
            <p><strong>Important:</strong> Please keep these credentials secure and do not share them with others.</p>
            
            <p>If you have any questions or need assistance, please contact your zone administrator.</p>
            
            <p>Best regards,<br>
            Pony Club Event Manager Team</p>
          </div>
        `,
        text: `
Your Pony Club Event Manager Login Credentials

Hello ${user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Pony Club Member'},

Here are your login credentials for the Pony Club Event Manager system:

Username: ${user.ponyClubId}
Password: ${user.mobileNumber}

You can use these credentials to log in to the Pony Club Event Manager at:
${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}

Important: Please keep these credentials secure and do not share them with others.

If you have any questions or need assistance, please contact your zone administrator.

Best regards,
Pony Club Event Manager Team
        `
      };

      // Log the email for development/testing purposes
      console.log('=== CREDENTIALS EMAIL ===');
      console.log(`To: ${emailContent.to}`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log('--- Email Content ---');
      console.log(emailContent.text);
      console.log('=====================');

      // TODO: Replace with actual email service implementation
      // Examples:
      // - SendGrid: await sgMail.send(emailContent);
      // - AWS SES: await ses.sendEmail(emailContent).promise();
      // - Nodemailer: await transporter.sendMail(emailContent);
      
      // For now, we'll simulate email sending
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      console.log(`Credentials email successfully "sent" to ${user.email}`);
      
    } catch (error) {
      console.error('Error sending credentials email:', error);
      throw new Error('Failed to send credentials email');
    }
  }

  /**
   * Enhanced import method with change detection for re-imports
   */
  static async importUsersWithChangeDetection(rawRows: unknown[], isReImport: boolean = false): Promise<UserImportResult> {
    const importBatch = uuidv4();
    const importedAt = new Date();
    const errors: UserImportError[] = [];
    let successfulImports = 0;
    let updatedUsers = 0;
    let createdUsers = 0;
    let deactivatedUsers = 0;
    let changesSummary: ImportChangesSummary | undefined;
    
    try {
      // Validate all rows first
      const { validRows, errors: validationErrors } = validateUserImportRows(rawRows);
      
      // Add validation errors to the error list
      errors.push(...validationErrors.map(e => ({
        row: e.row,
        data: e.data as UserImportRow,
        error: e.error
      })));

      // If this is a re-import, perform change detection analysis
      if (isReImport && validRows.length > 0) {
        changesSummary = await this.analyzeImportChanges(validRows);
        console.log('=== IMPORT CHANGES SUMMARY ===');
        console.log(`Total Rows: ${changesSummary.totalRows}`);
        console.log(`New Users: ${changesSummary.newUsers}`);
        console.log(`Users with Changes: ${changesSummary.usersWithChanges}`);
        console.log('Field Changes:');
        console.log(`  Email: ${changesSummary.fieldChanges.email}`);
        console.log(`  Mobile: ${changesSummary.fieldChanges.mobileNumber}`);
        console.log(`  First Name: ${changesSummary.fieldChanges.firstName}`);
        console.log(`  Last Name: ${changesSummary.fieldChanges.lastName}`);
        console.log(`  Club: ${changesSummary.fieldChanges.clubId}`);
        console.log('==============================');
      }
      
      // Process valid rows
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        const rowNumber = rawRows.findIndex(r => r === rawRows[validationErrors.length + i]) + 1;
        
        try {
          // Check for historical membership - handle these specially
          console.log(`[UserService] Processing row for ${row.ponyClubId}, membershipStatus: '${row.membershipStatus}'`);
          
          if (row.membershipStatus && row.membershipStatus.toLowerCase().includes('historical')) {
            console.log(`[UserService] Historical membership detected for ${row.ponyClubId}`);
            // Find existing user to deactivate
            const existingUser = await this.getUserByPonyClubId(row.ponyClubId);
            if (existingUser) {
              console.log(`[UserService] Found existing user ${row.ponyClubId}, deactivating...`);
              await this.deactivateUserForHistoricalMembership(existingUser.id, row.ponyClubId, importBatch);
              deactivatedUsers++;
              successfulImports++;
              console.log(`[UserService] Successfully deactivated user ${row.ponyClubId} due to historical membership`);
            } else {
              console.log(`[UserService] User ${row.ponyClubId} has historical membership but no existing account found - skipping`);
            }
          } else {
            console.log(`[UserService] Processing normal import for ${row.ponyClubId}`);
            // Normal processing for active memberships
            const result = await this.processUserImportWithRolePreservation(row, importBatch, importedAt, isReImport);
            successfulImports++;
            
            if (result.updated) {
              updatedUsers++;
            } else {
              createdUsers++;
            }
          }
          
        } catch (error) {
          console.error(`Error importing user at row ${rowNumber}:`, error);
          errors.push({
            row: rowNumber,
            data: {
              ponyClubId: row.ponyClubId || '',
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
        deactivatedUsers,
        errors,
        importBatch,
        importedAt,
        changesSummary // Include changes summary for re-imports
      };
      
    } catch (error) {
      console.error('Error during user import with change detection:', error);
      throw new Error('Failed to import users with change detection');
    }
  }

  /**
   * Enhanced import method with real-time progress tracking
   */
  static async importUsersWithProgressTracking(
    rawRows: unknown[], 
    isReImport: boolean = false,
    onProgress: (progress: ImportProgress) => void
  ): Promise<UserImportResult> {
    const importBatch = uuidv4();
    const importedAt = new Date();
    const errors: UserImportError[] = [];
    let successfulImports = 0;
    let updatedUsers = 0;
    let createdUsers = 0;
    let deactivatedUsers = 0;
    let changesSummary: ImportChangesSummary | undefined;
    
    try {
      // Validate all rows first
      const { validRows, errors: validationErrors } = validateUserImportRows(rawRows);
      
      // Add validation errors to the error list
      errors.push(...validationErrors.map(e => ({
        row: e.row,
        data: e.data as UserImportRow,
        error: e.error
      })));

      // If this is a re-import, perform change detection analysis
      if (isReImport && validRows.length > 0) {
        onProgress({
          phase: 'mapping',
          currentAction: 'Analyzing import changes...',
          processedRows: 0,
          totalRows: validRows.length,
          percentage: 0,
          stats: { createdUsers: 0, updatedUsers: 0, deactivatedUsers: 0, errorRows: 0 }
        });

        changesSummary = await this.analyzeImportChanges(validRows);
        console.log('=== IMPORT CHANGES SUMMARY ===');
        console.log(`Total Rows: ${changesSummary.totalRows}`);
        console.log(`New Users: ${changesSummary.newUsers}`);
        console.log(`Users with Changes: ${changesSummary.usersWithChanges}`);
        console.log('==============================');
      }
      
      // Process valid rows with progress tracking
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        const rowNumber = rawRows.findIndex(r => r === rawRows[validationErrors.length + i]) + 1;
        
        // Update progress every few rows or at key milestones
        if (i % 5 === 0 || i === validRows.length - 1) {
          const percentage = Math.round((i / validRows.length) * 100);
          onProgress({
            phase: 'mapping',
            currentAction: `Mapping and processing user ${i + 1} of ${validRows.length}: ${row.ponyClubId}`,
            processedRows: i,
            totalRows: validRows.length,
            percentage,
            stats: { 
              createdUsers, 
              updatedUsers, 
              deactivatedUsers, 
              errorRows: errors.length 
            }
          });
        }
        
        try {
          // Check for historical membership - handle these specially
          console.log(`[UserService] Processing row for ${row.ponyClubId}, membershipStatus: '${row.membershipStatus}'`);
          
          if (row.membershipStatus && row.membershipStatus.toLowerCase().includes('historical')) {
            console.log(`[UserService] Historical membership detected for ${row.ponyClubId}`);
            // Find existing user to deactivate
            const existingUser = await this.getUserByPonyClubId(row.ponyClubId);
            if (existingUser) {
              console.log(`[UserService] Found existing user ${row.ponyClubId}, deactivating...`);
              await this.deactivateUserForHistoricalMembership(existingUser.id, row.ponyClubId, importBatch);
              deactivatedUsers++;
              successfulImports++;
              console.log(`[UserService] Successfully deactivated user ${row.ponyClubId} due to historical membership`);
            } else {
              console.log(`[UserService] User ${row.ponyClubId} has historical membership but no existing account found - skipping`);
            }
          } else {
            console.log(`[UserService] Processing normal import for ${row.ponyClubId}`);
            // Normal processing for active memberships - use appropriate method based on re-import flag
            const result = isReImport 
              ? await this.processUserImportWithRolePreservation(row, importBatch, importedAt)
              : await this.processUserImport(row, importBatch, importedAt);
              
            successfulImports++;
            
            if (result.updated) {
              updatedUsers++;
            } else {
              createdUsers++;
            }
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

      // Send final progress update
      onProgress({
        phase: 'completed',
        currentAction: 'Import completed successfully!',
        processedRows: validRows.length,
        totalRows: validRows.length,
        percentage: 100,
        stats: { 
          createdUsers, 
          updatedUsers, 
          deactivatedUsers, 
          errorRows: errors.length 
        }
      });
      
      return {
        success: errors.length === 0,
        totalRows: rawRows.length,
        successfulImports,
        failedImports: errors.length,
        updatedUsers,
        createdUsers,
        deactivatedUsers,
        errors,
        importBatch,
        importedAt,
        changesSummary // Include changes summary for re-imports
      };
      
    } catch (error) {
      console.error('Error during user import with progress tracking:', error);
      
      onProgress({
        phase: 'error',
        currentAction: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processedRows: 0,
        totalRows: 0,
        percentage: 0,
        stats: { createdUsers, updatedUsers, deactivatedUsers, errorRows: errors.length }
      });
      
      throw new Error('Failed to import users with progress tracking');
    }
  }

  /**
   * Analyze what changes would be made during an import
   */
  static async analyzeImportChanges(validRows: ValidatedUserImportRow[]): Promise<ImportChangesSummary> {
    const changesSummary: ImportChangesSummary = {
      totalRows: validRows.length,
      newUsers: 0,
      usersWithChanges: 0,
      fieldChanges: {
        email: 0,
        mobileNumber: 0,
        firstName: 0,
        lastName: 0,
        clubId: 0,
        other: 0
      },
      detailedChanges: []
    };

    for (const row of validRows) {
      try {
        // Check if user exists
        const existingUser = await this.getUserByPonyClubId(row.ponyClubId);
        
        if (!existingUser) {
          changesSummary.newUsers++;
          continue;
        }

        // Compare data to detect changes
        const changes = await this.detectUserDataChanges(existingUser, row);
        
        if (changes.hasChanges) {
          changesSummary.usersWithChanges++;
          
          // Count field changes
          if (changes.changedFields.email) changesSummary.fieldChanges.email++;
          if (changes.changedFields.mobileNumber) changesSummary.fieldChanges.mobileNumber++;
          if (changes.changedFields.firstName) changesSummary.fieldChanges.firstName++;
          if (changes.changedFields.lastName) changesSummary.fieldChanges.lastName++;
          if (changes.changedFields.clubId) changesSummary.fieldChanges.clubId++;
          
          changesSummary.detailedChanges.push({
            ponyClubId: row.ponyClubId,
            changes: changes.changedFields
          });
        }
        
      } catch (error) {
        console.error(`Error analyzing changes for ${row.ponyClubId}:`, error);
      }
    }

    return changesSummary;
  }

  /**
   * Detect changes between existing user data and import data
   */
  static async detectUserDataChanges(existingUser: User, importData: ValidatedUserImportRow): Promise<UserDataChanges> {
    const changes: UserDataChanges = {
      hasChanges: false,
      changedFields: {}
    };

    // Check email changes
    if (importData.email && importData.email !== existingUser.email) {
      changes.changedFields.email = {
        old: existingUser.email || '',
        new: importData.email
      };
      changes.hasChanges = true;
    }

    // Check mobile number changes
    if (importData.mobileNumber && importData.mobileNumber !== existingUser.mobileNumber) {
      changes.changedFields.mobileNumber = {
        old: existingUser.mobileNumber || '',
        new: importData.mobileNumber
      };
      changes.hasChanges = true;
    }

    // Check first name changes
    if (importData.firstName && importData.firstName !== existingUser.firstName) {
      changes.changedFields.firstName = {
        old: existingUser.firstName || '',
        new: importData.firstName
      };
      changes.hasChanges = true;
    }

    // Check last name changes
    if (importData.lastName && importData.lastName !== existingUser.lastName) {
      changes.changedFields.lastName = {
        old: existingUser.lastName || '',
        new: importData.lastName
      };
      changes.hasChanges = true;
    }

    // Check club changes
    const mappingResult = await mapImportData({
      clubName: importData.clubName,
      zoneName: importData.zoneName
    });
    
    if (mappingResult.clubId && mappingResult.clubId !== existingUser.clubId) {
      changes.changedFields.clubId = {
        old: existingUser.clubId || '',
        new: mappingResult.clubId
      };
      changes.hasChanges = true;
    }

    return changes;
  }

  /**
   * Process a single user import with role preservation for re-imports
   */
  private static async processUserImportWithRolePreservation(
    row: ValidatedUserImportRow, 
    importBatch: string, 
    importedAt: Date,
    isReImport: boolean = false
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
    
    // Handle role assignment with proper preservation logic
    if (row.role !== undefined) {
      // Role column exists and has a value
      if (isReImport && existingUser && row.role !== existingUser.role) {
        // Re-import with role change - log the change and update
        console.log(`[UserService] Role change detected for ${row.ponyClubId}: ${existingUser.role} -> ${row.role}`);
        userData.role = row.role;
      } else if (!isReImport || !existingUser) {
        // New import or new user - set the provided role
        console.log(`[UserService] Setting role for ${row.ponyClubId}: ${row.role}`);
        userData.role = row.role;
      } else {
        // Re-import with same role - preserve existing
        userData.role = existingUser.role;
      }
    } else if (existingUser) {
      // No role column in spreadsheet - always preserve existing user's role
      userData.role = existingUser.role;
      console.log(`[UserService] No role column found, preserving existing role for ${row.ponyClubId}: ${existingUser.role}`);
    }
    // For new users with no role column, don't set a role (will use system default)
    
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
