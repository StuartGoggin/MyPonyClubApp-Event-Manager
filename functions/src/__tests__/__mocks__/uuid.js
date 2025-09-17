// Mock for uuid library
const uuid = {
  v4: jest.fn(() => 'mock-uuid-v4-string')
};

module.exports = uuid;