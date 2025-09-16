import { Router } from 'express';
import { getAllClubs, updateClub, createClub } from '../lib/server-data';
import { importClubsFromJson } from '../lib/club-import';

// Define the interface locally to avoid import issues
interface ClubJsonData {
  club_id: number;
  club_name: string;
  zone: string;
  physical_address: string;
  postal_address: string;
  email: string;
  phone: string;
  website_url: string;
  social_media_url: string;
}

const router = Router();

// GET /clubs - Fetch all clubs
router.get('/', async (req, res) => {
  try {
    const clubs = await getAllClubs();
    return res.json({ clubs });
  } catch (error: any) {
    console.error('Error fetching clubs:', error);
    
    // Check if it's a database connection error
    if (error.code === 14 || error.message?.includes('ETIMEDOUT') || error.message?.includes('UNAVAILABLE')) {
      console.warn('⚠️ Clubs API: Database connection timeout or unavailable');
      return res.status(503).json({
        error: 'Database connection timeout', 
        message: 'Unable to connect to the database. Please check your network connection and try again.',
        clubs: [] 
      });
    }
    
    return res.status(500).json({
      error: 'Failed to fetch clubs', 
      clubs: [] 
    });
  }
});

// POST /clubs - Create a new club
router.post('/', async (req, res) => {
  try {
    const clubData = req.body;
    const newClub = await createClub(clubData);
    
    if (!newClub) {
      return res.status(500).json({
        error: 'Failed to create club'
      });
    }
    
    return res.status(201).json(newClub);
  } catch (error) {
    console.error('Error creating club:', error);
    return res.status(500).json({
      error: 'Failed to create club'
    });
  }
});

// PUT /clubs - Update an existing club
router.put('/', async (req, res) => {
  try {
    const { id, ...clubData } = req.body;
    
    if (!id) {
      return res.status(400).json({
        error: 'Club ID is required'
      });
    }
    
    const updatedClub = await updateClub(id, clubData);
    
    if (!updatedClub) {
      return res.status(500).json({
        error: 'Failed to update club'
      });
    }
    
    return res.json(updatedClub);
  } catch (error) {
    console.error('Error updating club:', error);
    return res.status(500).json({
      error: 'Failed to update club'
    });
  }
});

// POST /clubs/import - Import clubs from JSON data
router.post('/import', async (req, res) => {
  try {
    const { clubs }: { clubs: ClubJsonData[] } = req.body;

    if (!clubs || !Array.isArray(clubs)) {
      return res.status(400).json({
        error: 'Invalid request: clubs array is required'
      });
    }

    if (clubs.length === 0) {
      return res.status(400).json({
        error: 'No clubs provided for import'
      });
    }

    // Perform the import
    const result = await importClubsFromJson(clubs);

    return res.json({
      success: true,
      message: `Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed`,
      ...result
    });

  } catch (error) {
    console.error('Club import error:', error);
    
    return res.status(500).json({
      error: 'Import failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
