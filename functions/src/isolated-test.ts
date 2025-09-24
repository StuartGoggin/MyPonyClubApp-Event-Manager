import { onRequest } from 'firebase-functions/v2/https';

// Completely isolated test function
export const isolatedTest = onRequest(async (req, res) => {
  res.status(200).json({
    message: 'Isolated test works',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 'not set',
    nodeVersion: process.version
  });
});