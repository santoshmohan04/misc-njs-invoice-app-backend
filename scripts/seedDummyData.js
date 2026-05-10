require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');

const { User } = require('../models/user');
const { Customer } = require('../models/customer');
const { Item } = require('../models/item');
const { Invoice } = require('../models/invoice');
const { Payment } = require('../models/payment');
const { AuditLog } = require('../models/auditLog');
const { ProcessedWebhookEvent } = require('../models/processedWebhookEvent');
const { RefreshToken } = require('../models/refreshToken');

const TOTAL = Number.parseInt(process.argv[2] || '30', 10);
const TARGET_EMAIL = (process.argv[3] || '').trim();

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const formatDateOnly = (date) => date.toISOString().slice(0, 10);

const run = async () => {
  if (!process.env.MONGODB_URL) {
    throw new Error('MONGODB_URL is missing. Add it to .env before seeding.');
  }

  if (!Number.isInteger(TOTAL) || TOTAL < 1) {
    throw new Error('Seed count must be a positive integer.');
  }

  await mongoose.connect(process.env.MONGODB_URL);

  const runTag = `seed-${Date.now()}`;

  let merchant = null;

  if (TARGET_EMAIL) {
    merchant = await User.findOne({ email: TARGET_EMAIL });
    if (!merchant) {
      throw new Error(`Target user not found for email: ${TARGET_EMAIL}`);
    }
  }

  if (!merchant) {
    merchant = await User.findOne({ lastActivityAt: { $ne: null } }).sort({ lastActivityAt: -1 });
  }

  if (!merchant) {
    merchant = await User.findOne().sort({ createdAt: -1 });
  }

  if (!merchant) {
    merchant = await User.create({
      name: 'Demo Merchant',
      email: 'demo.merchant@invoiceapp.local',
      password: 'DemoPassw0rd!',
      company: 'Demo Invoicing Co',
      phone: '+1-555-0100',
      address: '101 Seed Street, Demo City',
      base_currency: 'USD',
    });
  }

  const customersPayload = Array.from({ length: TOTAL }, (_, i) => ({
    name: `Customer ${i + 1} ${runTag}`,
    company: `Company ${i + 1}`,
    email: `${runTag}.customer${i + 1}@example.com`,
    phone: `+1-555-${String(1000 + i).padStart(4, '0')}`,
    mobile: `+1-777-${String(2000 + i).padStart(4, '0')}`,
    merchant: merchant._id,
    addresses: [`${100 + i} Demo Lane, Seed City`],
    number_invoices: 0,
    total: 0,
  }));

  const itemsPayload = Array.from({ length: TOTAL + 10 }, (_, i) => ({
    name: `Service ${i + 1} ${runTag}`,
    price: 100 + (i * 17) % 900,
    description: `Dummy line item ${i + 1} for UI preview`,
    merchant: merchant._id,
  }));

  const customers = await Customer.insertMany(customersPayload, { ordered: false });
  const items = await Item.insertMany(itemsPayload, { ordered: false });

  const invoicesPayload = customers.map((customer, i) => {
    const firstItem = items[i % items.length];
    const secondItem = items[(i + 3) % items.length];

    const qtyOne = (i % 3) + 1;
    const qtyTwo = ((i + 1) % 2) + 1;

    const lineOneSubtotal = Number((firstItem.price * qtyOne).toFixed(2));
    const lineTwoSubtotal = Number((secondItem.price * qtyTwo).toFixed(2));
    const subtotal = Number((lineOneSubtotal + lineTwoSubtotal).toFixed(2));
    const discount = Number((i % 5 === 0 ? subtotal * 0.05 : 0).toFixed(2));
    const total = Number((subtotal - discount).toFixed(2));

    const issued = new Date();
    issued.setDate(issued.getDate() - (i + 1));

    const due = new Date(issued);
    due.setDate(due.getDate() + 30);

    return {
      number: `INV-${runTag}-${String(i + 1).padStart(4, '0')}`,
      merchant: merchant._id,
      customer: customer._id,
      issued: formatDateOnly(issued),
      due: formatDateOnly(due),
      items: [
        {
          item: firstItem._id,
          quantity: qtyOne,
          subtotal: lineOneSubtotal,
        },
        {
          item: secondItem._id,
          quantity: qtyTwo,
          subtotal: lineTwoSubtotal,
        },
      ],
      subtotal,
      discount,
      total,
    };
  });

  const invoices = await Invoice.insertMany(invoicesPayload, { ordered: false });

  const statusPool = ['pending', 'completed', 'failed', 'cancelled'];

  const paymentsPayload = invoices.map((invoice, i) => {
    const status = randomFrom(statusPool);
    const amount = invoice.total;
    const amountPaid = status === 'completed' ? amount : Number((amount * (i % 4 === 0 ? 0.4 : 0)).toFixed(2));

    return {
      merchant: merchant._id,
      invoice: invoice._id,
      status,
      amount,
      currency: 'usd',
      method: randomFrom(['card', 'bank_transfer', 'cash', 'check']),
      paid_on: new Date(),
      amount_paid: amountPaid,
      amount_due: Number((amount - amountPaid).toFixed(2)),
      processedAt: status === 'completed' ? new Date() : null,
    };
  });

  const payments = await Payment.insertMany(paymentsPayload, { ordered: false });

  const customerUpdates = invoices.map((invoice) => ({
    updateOne: {
      filter: { _id: invoice.customer },
      update: {
        $inc: {
          number_invoices: 1,
          total: invoice.total,
        },
      },
    },
  }));

  if (customerUpdates.length) {
    await Customer.bulkWrite(customerUpdates);
  }

  const auditPayload = invoices.map((invoice, i) => ({
    actorId: merchant._id,
    action: 'invoice.create',
    entityType: 'invoice',
    entityId: String(invoice._id),
    metadata: {
      number: invoice.number,
      index: i,
      source: 'dummy-seed',
    },
    ipAddress: '127.0.0.1',
    userAgent: 'seed-script',
    createdAt: new Date(),
  }));

  const auditLogs = await AuditLog.insertMany(auditPayload, { ordered: false });

  const webhookPayload = payments.map((payment, i) => ({
    eventId: `${runTag}-evt-${i + 1}`,
    type: `payment_intent.${payment.status === 'completed' ? 'succeeded' : 'payment_failed'}`,
    processedAt: new Date(),
    payload: {
      paymentId: String(payment._id),
      invoiceId: String(payment.invoice),
      seed: true,
    },
  }));

  const webhookEvents = await ProcessedWebhookEvent.insertMany(webhookPayload, { ordered: false });

  const refreshTokenPayload = Array.from({ length: TOTAL }, (_, i) => ({
    userId: merchant._id,
    token: crypto.randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + (7 + i) * 24 * 60 * 60 * 1000),
    revoked: i % 5 === 0,
    deviceInfo: `Demo Device ${i + 1}`,
    ipAddress: `10.0.0.${(i % 254) + 1}`,
    fingerprint: crypto.createHash('sha256').update(`${runTag}-${i}`).digest('hex').slice(0, 32),
    lastUsedAt: new Date(),
  }));

  const refreshTokens = await RefreshToken.insertMany(refreshTokenPayload, { ordered: false });

  const totals = {
    users: await User.countDocuments(),
    customers: await Customer.countDocuments(),
    items: await Item.countDocuments(),
    invoices: await Invoice.countDocuments(),
    payments: await Payment.countDocuments(),
    audit_logs: await AuditLog.countDocuments(),
    processed_webhook_events: await ProcessedWebhookEvent.countDocuments(),
    refresh_tokens: await RefreshToken.countDocuments(),
  };

  console.log('Seed completed successfully.');
  console.log(`Run tag: ${runTag}`);
  console.log(`Target merchant: ${merchant.email} (${merchant._id})`);
  console.log('Inserted in this run:');
  console.table({
    users: merchant ? 1 : 0,
    customers: customers.length,
    items: items.length,
    invoices: invoices.length,
    payments: payments.length,
    audit_logs: auditLogs.length,
    processed_webhook_events: webhookEvents.length,
    refresh_tokens: refreshTokens.length,
  });
  console.log('Total documents now:');
  console.table(totals);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Seed failed:', error.message);
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  process.exit(1);
});
