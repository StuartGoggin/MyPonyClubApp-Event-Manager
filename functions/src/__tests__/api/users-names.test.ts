import express, { Express } from 'express';
import request from 'supertest';
import userNamesRouter from '../../api/users/names';
import { UserService } from '../../lib/user-service';
import { User, UserRole } from '../../lib/types';

// Mock dependencies
jest.mock('../../lib/user-service');
jest.mock('firebase-functions/v2', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock Firebase Admin
jest.mock('../../lib/firebase-admin', () => ({
  adminDb: {}
}));

const MockedUserService = UserService as jest.Mocked<typeof UserService>;

describe('User Names API', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/users/names', userNamesRouter);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /users/names', () => {
    const mockUsers: User[] = [
      {
        id: 'user-1',
        ponyClubId: 'PC123456',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        role: 'standard' as UserRole as UserRole,
        clubId: 'club-1',
        zoneId: 'zone-1',
        isActive: true,
        mobileNumber: '+61412345678',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'user-2',
        ponyClubId: 'PC789012',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        role: 'zone_rep' as UserRole as UserRole,
        clubId: 'club-2',
        zoneId: 'zone-1',
        isActive: true,
        mobileNumber: '+61498765432',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'user-3',
        ponyClubId: 'PC555666',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        role: 'standard' as UserRole as UserRole,
        clubId: 'club-3',
        zoneId: 'zone-2',
        isActive: true,
        mobileNumber: '+61433221144',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ];

    it('should return all user names when no search query provided', async () => {
      MockedUserService.getUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/users/names')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        results: expect.arrayContaining([
          expect.objectContaining({
            name: 'Alice Johnson',
            clubId: 'club-3',
            zoneId: 'zone-2',
            user: expect.objectContaining({
              id: 'user-3',
              firstName: 'Alice',
              lastName: 'Johnson',
              role: 'standard' as UserRole
            })
          }),
          expect.objectContaining({
            name: 'Jane Doe',
            clubId: 'club-2',
            zoneId: 'zone-1',
            user: expect.objectContaining({
              id: 'user-2',
              firstName: 'Jane',
              lastName: 'Doe',
              role: 'zone_rep' as UserRole
            })
          }),
          expect.objectContaining({
            name: 'John Smith',
            clubId: 'club-1',
            zoneId: 'zone-1',
            user: expect.objectContaining({
              id: 'user-1',
              firstName: 'John',
              lastName: 'Smith',
              role: 'standard' as UserRole
            })
          })
        ]),
        count: expect.any(Number),
        totalUsers: 3
      });

      // Verify UserService was called with correct parameters
      expect(MockedUserService.getUsers).toHaveBeenCalledWith({ isActive: true });

      // Verify results are sorted alphabetically
      const names = response.body.results.map((r: any) => r.name);
      expect(names).toEqual([...names].sort());
    });

    it('should filter results based on search query', async () => {
      MockedUserService.getUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/users/names?search=john')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(2); // John Smith and Alice Johnson

      const names = response.body.results.map((r: any) => r.name);
      expect(names).toEqual(expect.arrayContaining(['John Smith', 'Alice Johnson']));
    });

    it('should respect limit parameter', async () => {
      MockedUserService.getUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/users/names?limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.count).toBe(1);
      expect(response.body.totalUsers).toBe(3);
    });

    it('should cap limit at maximum value', async () => {
      MockedUserService.getUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/users/names?limit=100')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should be capped at 50 in the implementation
    });

    it('should handle empty search results', async () => {
      MockedUserService.getUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/users/names?search=nonexistent')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        results: [],
        count: 0,
        totalUsers: 3
      });
    });

    it('should include both full names and first names', async () => {
      const usersWithVariousNames: User[] = [
        {
          id: 'user-1',
          ponyClubId: 'PC123456',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@example.com',
          role: 'standard' as UserRole as UserRole,
          clubId: 'club-1',
          zoneId: 'zone-1',
          isActive: true,
          mobileNumber: '+61412345678',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'user-2',
          ponyClubId: 'PC789012',
          firstName: 'Mike',
          lastName: '',  // User with no last name
          email: 'mike@example.com',
          role: 'standard' as UserRole as UserRole,
          clubId: 'club-2',
          zoneId: 'zone-1',
          isActive: true,
          mobileNumber: '+61498765432',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      MockedUserService.getUsers.mockResolvedValue(usersWithVariousNames);

      const response = await request(app)
        .get('/users/names')
        .expect(200);

      const names = response.body.results.map((r: any) => r.name);
      expect(names).toEqual(expect.arrayContaining(['John Smith', 'Mike']));
    });

    it('should handle users with missing names gracefully', async () => {
      const usersWithMissingNames = [
        {
          id: 'user-1',
          ponyClubId: 'PC123456',
          firstName: '',
          lastName: '',
          email: 'noname@example.com',
          role: 'standard' as UserRole,
          clubId: 'club-1',
          zoneId: 'zone-1',
          isActive: true,
          mobileNumber: '+61412345678',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'user-2',
          ponyClubId: 'PC789012',
          firstName: 'Valid',
          lastName: 'User',
          email: 'valid@example.com',
          role: 'standard' as UserRole,
          clubId: 'club-2',
          zoneId: 'zone-1',
          isActive: true,
          mobileNumber: '+61498765432',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      MockedUserService.getUsers.mockResolvedValue(usersWithMissingNames);

      const response = await request(app)
        .get('/users/names')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should only include users with valid names
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].name).toBe('Valid User');
    });

    it('should include user data with sensitive fields preserved', async () => {
      MockedUserService.getUsers.mockResolvedValue([mockUsers[0]]);

      const response = await request(app)
        .get('/users/names')
        .expect(200);

      expect(response.body.results[0].user).toEqual({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        mobileNumber: '+61412345678',
        clubId: 'club-1',
        zoneId: 'zone-1',
        role: 'standard' as UserRole
      });
    });

    it('should handle service errors gracefully', async () => {
      MockedUserService.getUsers.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/users/names')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to retrieve user names',
        details: 'Database connection failed'
      });
    });

    it('should perform case-insensitive search', async () => {
      MockedUserService.getUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/users/names?search=JOHN')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBeGreaterThan(0);
      
      const names = response.body.results.map((r: any) => r.name);
      expect(names).toEqual(expect.arrayContaining(['John Smith', 'Alice Johnson']));
    });

    it('should handle partial name matches', async () => {
      MockedUserService.getUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/users/names?search=smi')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].name).toBe('John Smith');
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle large user datasets efficiently', async () => {
      // Create a large dataset of users
      const largeUserSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        ponyClubId: `PC${String(i).padStart(6, '0')}`,
        firstName: `User${i}`,
        lastName: `Last${i}`,
        email: `user${i}@example.com`,
        role: 'standard' as UserRole,
        clubId: `club-${Math.floor(i / 100)}`,
        zoneId: `zone-${Math.floor(i / 500)}`,
        isActive: true,
        mobileNumber: `+6141234${String(i).padStart(4, '0')}`,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }));

      MockedUserService.getUsers.mockResolvedValue(largeUserSet);

      const startTime = Date.now();
      const response = await request(app)
        .get('/users/names?limit=20')
        .expect(200);
      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(20);
      expect(response.body.totalUsers).toBe(1000);
      
      // Should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle special characters in names', async () => {
      const usersWithSpecialChars = [
        {
          id: 'user-1',
          ponyClubId: 'PC123456',
          firstName: 'María',
          lastName: "O'Connor",
          email: 'maria@example.com',
          role: 'standard' as UserRole,
          clubId: 'club-1',
          zoneId: 'zone-1',
          isActive: true,
          mobileNumber: '+61412345678',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      MockedUserService.getUsers.mockResolvedValue(usersWithSpecialChars);

      const response = await request(app)
        .get('/users/names')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results[0].name).toBe("María O'Connor");
    });
  });
});
