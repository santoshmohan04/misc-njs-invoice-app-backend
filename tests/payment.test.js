jest.mock('../src/repositories/paymentRepository', () => ({
  findOne: jest.fn(),
  updateById: jest.fn(),
}));

const PaymentService = require('../src/services/paymentService');

describe('PaymentService', () => {
  test('updateStatus rejects invalid status values', async () => {
    const result = await PaymentService.updateStatus('64a1b2c3d4e5f6a7b8c9d010', 'unknown', '64a1b2c3d4e5f6a7b8c9d001');
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(400);
  });
});
