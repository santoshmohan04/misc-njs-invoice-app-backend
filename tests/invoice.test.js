jest.mock('../src/repositories/invoiceRepository', () => ({
  upsert: jest.fn(),
}));

jest.mock('../src/repositories/customerRepository', () => ({
  findById: jest.fn(),
  incrementInvoiceCount: jest.fn(),
}));

jest.mock('../src/services/auditService', () => ({
  log: jest.fn(),
}));

const mongoose = require('mongoose');
const InvoiceService = require('../src/services/invoiceService');
const invoiceRepository = require('../src/repositories/invoiceRepository');
const customerRepository = require('../src/repositories/customerRepository');

describe('InvoiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createOrUpdate returns not found when customer does not exist', async () => {
    customerRepository.findById.mockResolvedValue(null);

    const result = await InvoiceService.createOrUpdate({ customer: '64a1b2c3d4e5f6a7b8c9d100' }, '64a1b2c3d4e5f6a7b8c9d001');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
    expect(invoiceRepository.upsert).not.toHaveBeenCalled();
  });

  test.each(['ObjectId', 'string'])('createOrUpdate accepts matching %s merchant IDs', async (type) => {
    const id = new mongoose.Types.ObjectId();
    const merchantId = type === 'ObjectId' ? id : id.toString();
    const invoiceData = { customer: '64a1b2c3d4e5f6a7b8c9d100', total: 32.75 };
    const invoice = { _id: new mongoose.Types.ObjectId() };
    customerRepository.findById.mockResolvedValue({ merchant: new mongoose.Types.ObjectId(id.toString()) });
    invoiceRepository.upsert.mockResolvedValue(invoice);

    const result = await InvoiceService.createOrUpdate(invoiceData, merchantId);

    expect(result.success).toBe(true);
    expect(invoiceRepository.upsert).toHaveBeenCalledWith({ ...invoiceData, merchant: merchantId });
    expect(customerRepository.incrementInvoiceCount).toHaveBeenCalledWith(invoiceData.customer, 32.75);
  });

  test('createOrUpdate rejects a customer belonging to another merchant', async () => {
    customerRepository.findById.mockResolvedValue({ merchant: new mongoose.Types.ObjectId() });

    const result = await InvoiceService.createOrUpdate(
      { customer: '64a1b2c3d4e5f6a7b8c9d100' },
      new mongoose.Types.ObjectId()
    );

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
    expect(invoiceRepository.upsert).not.toHaveBeenCalled();
  });

  test('createOrUpdate rejects a customer without a merchant', async () => {
    customerRepository.findById.mockResolvedValue({ merchant: null });

    const result = await InvoiceService.createOrUpdate(
      { customer: '64a1b2c3d4e5f6a7b8c9d100' },
      new mongoose.Types.ObjectId()
    );

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
    expect(invoiceRepository.upsert).not.toHaveBeenCalled();
  });
});
