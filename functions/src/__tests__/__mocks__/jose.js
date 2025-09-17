// Mock for jose library
const mockPayload = {
  userId: 'user-1',
  ponyClubId: 'PC123456',
  role: 'standard',
  clubId: 'club-1',
  zoneId: 'zone-1',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
};

const jose = {
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setPayload: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock.jwt.token.signature')
  })),
  jwtVerify: jest.fn().mockImplementation((token) => {
    if (token === 'invalid-token') {
      throw new Error('Invalid token');
    }
    return Promise.resolve({
      payload: mockPayload
    });
  })
};

module.exports = jose;