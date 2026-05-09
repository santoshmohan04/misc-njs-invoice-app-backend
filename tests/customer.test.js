jest.mock('../src/repositories/customerRepository', () => ({
  findByEmailAndMerchant: jest.fn(),
  create: jest.fn(),
}));

const CustomerService = require('../src/services/customerService');
const customerRepository = require('../src/repositories/customerRepository');

describe('CustomerService', () => {
  test('create blocks duplicate customer email', async () => {
    customerRepository.findByEmailAndMerchant.mockResolvedValue({ _id: '1' });

    const result = await CustomerService.create(
      { name: 'Acme', email: 'billing@acme.com', phone: '99999999', address: '123 long address street' },
      '64a1b2c3d4e5f6a7b8c9d001'
    );

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(409);
  });
});
