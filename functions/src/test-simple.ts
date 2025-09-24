import { onRequest } from 'firebase-functions/v2/https';

// Completely minimal function with no other imports
export const testSimple = onRequest(async (req, res) => {
  try {
    res.status(200).json({
      message: 'Simple test function works',
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      port: process.env.PORT || 'not set'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Function failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});