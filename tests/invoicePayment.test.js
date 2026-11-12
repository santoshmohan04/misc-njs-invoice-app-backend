const mongoose = require('mongoose');
const { Invoice } = require('../models/invoice');
const { Payment } = require('../models/payment');

describe('Invoice payment population', () => {
  test('returns the linked payment and null when no payment exists', async () => {
    const invoiceId = new mongoose.Types.ObjectId();
    const invoices = [
      Invoice.hydrate({ _id: invoiceId, number: 'INV-0001' }),
      Invoice.hydrate({ _id: new mongoose.Types.ObjectId(), number: 'INV-0002' }),
    ];
    const payment = Payment.hydrate({
      _id: new mongoose.Types.ObjectId(),
      invoice: invoiceId,
      status: 'pending',
      amount_paid: 0,
      amount_due: 10,
    });
    const find = Payment.find.bind(Payment);
    jest.spyOn(Payment, 'find').mockImplementation((...args) => {
      const query = find(...args);
      jest.spyOn(query, 'exec').mockResolvedValue([payment]);
      return query;
    });

    await Invoice.populate(invoices, { path: 'payment' });

    expect(invoices[0].toJSON().payment._id).toEqual(payment._id);
    expect(invoices[0].toJSON().payment.status).toBe('pending');
    expect(invoices[1].toJSON().payment).toBeNull();
  });
});
