import { adminDb } from './firebase-admin';
import { User } from './types';
import { v4 as uuidv4 } from 'uuid';

const USERS_COLLECTION = 'users';

export class UserService {
  
  /**
   * Get users with optional filtering
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

      // Apply filters
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
      const users: User[] = [];

      snapshot.forEach((doc: any) => {
        users.push({
          id: doc.id,
          ...doc.data()
        } as User);
      });

      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      throw new Error(`Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a Pony Club ID already exists
   */
  static async ponyClubIdExists(ponyClubId: string, excludeUserId?: string): Promise<boolean> {
    try {
      let query = adminDb
        .collection(USERS_COLLECTION)
        .where('ponyClubId', '==', ponyClubId.toUpperCase());

      const snapshot = await query.get();
      
      if (excludeUserId) {
        // Check if any documents exist that don't match the excluded user ID
        return snapshot.docs.some((doc: any) => doc.id !== excludeUserId);
      }
      
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking Pony Club ID:', error);
      throw new Error(`Failed to check Pony Club ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new user
   */
  static async createUser(userData: Partial<User>): Promise<User> {
    try {
      const userId = uuidv4();
      const timestamp = new Date().toISOString();
      
      const newUser: User = {
        id: userId,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        mobileNumber: userData.mobileNumber || '',
        ponyClubId: userData.ponyClubId?.toUpperCase() || '',
        clubId: userData.clubId || '',
        zoneId: userData.zoneId || '',
        role: userData.role || 'standard',
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        address: userData.address || '',
        emergencyContact: userData.emergencyContact || '',
        membershipNumber: userData.membershipNumber || '',
        dateOfBirth: userData.dateOfBirth || '',
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await adminDb.collection(USERS_COLLECTION).doc(userId).set(newUser);
      
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a user
   */
  static async updateUser(userId: string, updateData: Partial<User>): Promise<User> {
    try {
      const timestamp = new Date().toISOString();
      
      // Remove fields that shouldn't be updated
      const { id, createdAt, ...safeUpdateData } = updateData;
      
      const updatedData = {
        ...safeUpdateData,
        updatedAt: timestamp
      };

      // If updating ponyClubId, ensure it's uppercase
      if (updatedData.ponyClubId) {
        updatedData.ponyClubId = updatedData.ponyClubId.toUpperCase();
      }

      await adminDb.collection(USERS_COLLECTION).doc(userId).update(updatedData);
      
      // Get the updated user document
      const userDoc = await adminDb.collection(USERS_COLLECTION).doc(userId).get();
      
      if (!userDoc.exists) {
        throw new Error('User not found after update');
      }

      return {
        id: userDoc.id,
        ...userDoc.data()
      } as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Soft delete a user (set isActive to false)
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      
      await adminDb.collection(USERS_COLLECTION).doc(userId).update({
        isActive: false,
        updatedAt: timestamp
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await adminDb.collection(USERS_COLLECTION).doc(userId).get();
      
      if (!userDoc.exists) {
        return null;
      }

      return {
        id: userDoc.id,
        ...userDoc.data()
      } as User;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}