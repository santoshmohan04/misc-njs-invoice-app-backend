jest.mock('../src/repositories/userRepository', () => ({
  create: jest.fn(),
  findByCredentials: jest.fn(),
  addToken: jest.fn(),
  findByRefreshToken: jest.fn(),
  removeToken: jest.fn(),
  removeAllTokens: jest.fn(),
  findByToken: jest.fn(),
  updateProfile: jest.fn(),
}));

jest.mock('../src/repositories/refreshTokenRepository', () => ({
  createToken: jest.fn(),
  findActiveToken: jest.fn(),
  updateById: jest.fn(),
  revokeToken: jest.fn(),
  revokeByUser: jest.fn(),
}));

const AuthService = require('../src/services/authService');
const userRepository = require('../src/repositories/userRepository');
const refreshTokenRepository = require('../src/repositories/refreshTokenRepository');
const { createMockUser } = require('./utils/mockAuth');

describe('AuthService', () => {
  test('login returns success envelope with access and refresh tokens', async () => {
    userRepository.findByCredentials.mockResolvedValue(createMockUser());
    const result = await AuthService.login('owner@example.com', 'Secure123!');

    expect(result.success).toBe(true);
    expect(result.data.accessToken).toBeTruthy();
    expect(result.data.refreshToken).toBeTruthy();
    expect(userRepository.addToken).toHaveBeenCalled();
    expect(refreshTokenRepository.createToken).toHaveBeenCalled();
  });
});
