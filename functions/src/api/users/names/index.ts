import { Request, Response, Router } from 'express';
import { logger } from 'firebase-functions/v2';
import { UserService } from '../../../lib/user-service';

const router = Router();

/**
 * GET /users/names
 * Retrieve user names for autocomplete functionality
 * Query parameters:
 *   - search: Optional search term to filter names
 *   - limit: Optional limit on number of results (default: 20)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || '';
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50); // Cap at 50 results
    
    logger.info('User names search requested', { 
      search: search || '(empty)',
      limit
    });
    
    // Get all active users
    const users = await UserService.getUsers({ isActive: true });
    
    // Create names list with associated user data
    const namesWithData = new Map<string, { clubId?: string; zoneId?: string; user: any }>();
    
    users.forEach(user => {
      // Add full name if both first and last name exist
      if (user.firstName && user.lastName) {
        const fullName = `${user.firstName} ${user.lastName}`.trim();
        namesWithData.set(fullName, {
          clubId: user.clubId,
          zoneId: user.zoneId,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobileNumber: user.mobileNumber,
            clubId: user.clubId,
            zoneId: user.zoneId,
            role: user.role
          }
        });
      }
      
      // Add first name only if it exists and isn't already in the map
      if (user.firstName) {
        const firstName = user.firstName.trim();
        if (!namesWithData.has(firstName)) {
          namesWithData.set(firstName, {
            clubId: user.clubId,
            zoneId: user.zoneId,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              mobileNumber: user.mobileNumber,
              clubId: user.clubId,
              zoneId: user.zoneId,
              role: user.role
            }
          });
        }
      }
    });
    
    // Filter by search term and convert to array
    let namesList = Array.from(namesWithData.entries())
      .filter(([name]) => name.length > 0);
    
    if (search) {
      namesList = namesList.filter(([name]) => 
        name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Sort alphabetically and apply limit
    namesList = namesList
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, limit);
    
    // Convert to response format
    const results = namesList.map(([name, data]) => ({
      name,
      clubId: data.clubId,
      zoneId: data.zoneId,
      user: data.user
    }));
    
    logger.info('User names search completed', { 
      search: search || '(empty)',
      totalUsers: users.length,
      filteredResults: results.length
    });
    
    res.json({
      success: true,
      results: results,
      count: results.length,
      totalUsers: users.length
    });
    
  } catch (error) {
    logger.error('Get user names error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      search: req.query.search
    });
    
    res.status(500).json({
      error: 'Failed to retrieve user names',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;