jest.mock('../src/repositories/invoiceRepository', () => ({
  upsert: jest.fn(),
}));

jest.mock('../src/repositories/customerRepository', () => ({
  findById: jest.fn(),
}));

const InvoiceService = require('../src/services/invoiceService');
const invoiceRepository = require('../src/repositories/invoiceRepository');
const customerRepository = require('../src/repositories/customerRepository');

describe('InvoiceService', () => {
  test('createOrUpdate returns not found when customer does not exist', async () => {
    customerRepository.findById.mockResolvedValue(null);

    const result = await InvoiceService.createOrUpdate({ customer: '64a1b2c3d4e5f6a7b8c9d100' }, '64a1b2c3d4e5f6a7b8c9d001');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
    expect(invoiceRepository.upsert).not.toHaveBeenCalled();
  });
});
